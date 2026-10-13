import {
  bindingNamePattern,
  isShape,
  jsonSchemaOf,
  maxBindingName,
  shapeEntries,
  type InputOf,
  type PropSchema,
  type PropShape,
} from "../catalog/schema.js";
import { type InferOutput, type StandardSchemaV1 } from "../catalog/standard-schema.js";
import { type JsonValue } from "../json/parse.js";
import { createGenUIStore, type GenUIState, type GenUIStore } from "../state/store.js";

type OutputOf<T> = T extends StandardSchemaV1
  ? InferOutput<T>
  : T extends PropShape
    ? StateValues<T>
    : never;
export type StateValues<T extends PropShape> = { [K in keyof T]: OutputOf<T[K]> };

export type StateContract<T extends PropShape = PropShape> = {
  readonly shape: T;
  readonly initial: StateValues<T> & GenUIState;
  createStore(initialOverrides?: Readonly<Record<string, unknown>>): GenUIStore;
  accepts(name: string, value: unknown): boolean;
};

type Checked = { value: JsonValue } | undefined;

function isJson(value: unknown, depth = 0): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (depth > 8 || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.every((item) => isJson(item, depth + 1));
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(value).every((item) => isJson(item, depth + 1));
}

/** Runs synchronous Standard Schema validation, retaining transformed output. */
function check(schema: PropSchema | PropShape, value: unknown): Checked {
  try {
    if (isShape(schema)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const result: Record<string, JsonValue> = Object.create(null);
      for (const entry of shapeEntries(schema)) {
        let child: unknown;
        if (Object.hasOwn(value, entry.name))
          child = (value as Record<string, unknown>)[entry.name];
        if (entry.optional && (child === undefined || child === null)) continue;
        const checked = check(entry.schema, child);
        if (!checked) return;
        result[entry.name] = checked.value;
      }
      return { value: result };
    }
    const result = schema["~standard"].validate(value);
    if (result instanceof Promise) {
      result.catch(() => undefined);
      return;
    }
    if (result.issues !== undefined || !isJson(result.value)) return;
    return { value: result.value };
  } catch {
    return;
  }
}

/** Declares host-owned state, with a valid initial value for every name. */
export function state<T extends PropShape>(
  shape: T,
  defaults: Partial<InputOf<T>> = {},
): StateContract<T> {
  const schemas = new Map<string, PropSchema | PropShape>();
  for (const [name, schema] of Object.entries(shape)) {
    if (name.length > maxBindingName || !bindingNamePattern.test(name)) {
      throw new Error(`Invalid state name: ${name}`);
    }
    jsonSchemaOf(schema);
    schemas.set(name, schema);
  }
  for (const name of Object.keys(defaults)) {
    if (!schemas.has(name)) throw new Error(`Unknown state default: ${name}`);
  }
  const initial: Record<string, JsonValue> = Object.create(null);
  for (const [name, schema] of schemas) {
    let value: unknown;
    if (Object.hasOwn(defaults, name)) value = (defaults as Record<string, unknown>)[name];
    const checked = check(schema, value);
    if (!checked) throw new Error(`State ${name} needs a valid synchronous default`);
    initial[name] = checked.value;
  }
  return {
    shape,
    initial: Object.freeze(initial) as StateValues<T> & GenUIState,
    accepts(name, value) {
      const schema = schemas.get(name);
      return schema !== undefined && check(schema, value) !== undefined;
    },
    createStore(initialOverrides = {}) {
      const restored = { ...initial };
      for (const [name, value] of Object.entries(initialOverrides)) {
        const schema = schemas.get(name);
        if (!schema) continue;
        const checked = check(schema, value);
        if (checked) restored[name] = checked.value;
      }
      const store = createGenUIStore(restored);
      return {
        ...store,
        set(name, value) {
          const schema = schemas.get(name);
          if (!schema) return;
          const checked = check(schema, value);
          if (checked) store.set(name, checked.value);
        },
        seed(name, value) {
          const schema = schemas.get(name);
          if (!schema) return;
          const checked = check(schema, value);
          if (checked) store.seed(name, checked.value);
        },
      };
    },
  };
}
