import { type ReactNode } from "react";
import { z } from "zod";
import { type JsonValue } from "../json/parse.js";

/*
 * Markers. Zod describes data; these helpers tag a few schemas with meaning the validator and
 * the JSON Schema generator need: a slot for nested components, a value a control can bind to,
 * a computed value, and a URL. They are identified by the schema's definition object, which
 * `.describe()` and `.optional()` share with the schema they derive from.
 */

function definitionOf(schema: unknown): object | undefined {
  const def = (schema as { _zod?: { def?: object } } | null)?._zod?.def;
  return typeof def === "object" ? def : undefined;
}

const nodeSlots = new WeakSet<object>();
const bindables = new WeakMap<object, { inner: z.ZodType; binding: z.ZodObject }>();
const computeds = new WeakMap<object, { inner: z.ZodType; expression: z.ZodObject }>();
const urls = new WeakMap<object, "link" | "image">();

/** The shape of the binding object a model writes: `{ "$bind": "seats", "initial": 3 }`. */
export type BindingInput<TValue = JsonValue> = { $bind: string; initial?: TValue | undefined };

/** The shape of the expression object a model writes: `{ "$expr": "seats * 12" }`. */
export type ExpressionInput = { $expr: string };

/** The longest name a binding may have. */
export const maxBindingName = 64;
/** What a binding name looks like; the same words an expression reads. */
export const bindingNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * A slot for nested components: an array of component objects. The renderer turns the validated
 * nodes into React elements, so a facade receives a plain `ReactNode`.
 */
export function nodes(description: string): z.ZodType<ReactNode> {
  const schema = z.array(z.unknown()).describe(description);
  nodeSlots.add(definitionOf(schema)!);
  return schema as unknown as z.ZodType<ReactNode>;
}

/** Whether a (possibly optional) schema was created by `nodes()`. */
export function isNodesSchema(schema: unknown): boolean {
  const def = definitionOf(schema);
  if (def === undefined) return false;
  if (nodeSlots.has(def)) return true;
  const inner = (schema as { _zod?: { def?: { innerType?: unknown } } })._zod?.def?.innerType;
  return inner !== undefined && isNodesSchema(inner);
}

/** The keys of a props schema that hold nested components. */
export function nodeSlotKeys(props: z.ZodObject): string[] {
  return Object.entries(props.shape)
    .filter(([, schema]) => isNodesSchema(schema))
    .map(([key]) => key);
}

/**
 * A value a control can read and write through a shared name: either the literal value or
 * `{ "$bind": name, "initial"?: value }`. Expressions elsewhere in the response read the name.
 */
export function bindable<TInner extends z.ZodType>(
  inner: TInner,
): z.ZodType<z.infer<TInner> | BindingInput<z.infer<TInner>>> {
  const binding = z.object({
    $bind: z
      .string()
      .max(maxBindingName)
      .regex(bindingNamePattern)
      .describe("Name of the shared value this control reads and writes, such as seats."),
    initial: inner.optional().describe("Starting value of the name until the person changes it."),
  });
  const union = z.union([inner, binding]);
  bindables.set(definitionOf(union)!, { inner, binding });
  return union as never;
}

/** A value that is either literal or `{ "$expr": "seats * 12" }`, computed from bound names. */
export function computed<TInner extends z.ZodType>(
  inner: TInner,
): z.ZodType<z.infer<TInner> | ExpressionInput> {
  const expression = z.object({
    $expr: z
      .string()
      .max(500)
      .describe("An expression over bound names, such as seats * 12 or round(price * 1.2, 2)."),
  });
  const union = z.union([inner, expression]);
  computeds.set(definitionOf(union)!, { inner, expression });
  return union as never;
}

/**
 * A URL a person may follow (`link`) or an image source (`image`). The validator rejects every
 * unsafe scheme before the value reaches a component.
 */
export function url(kind: "link" | "image", description: string): z.ZodString {
  const schema = z.string().describe(description);
  urls.set(definitionOf(schema)!, kind);
  return schema;
}

/** The marker data of a schema, if it is one of the helpers above. */
export function markerOf(
  schema: unknown,
):
  | { kind: "nodes" }
  | { kind: "bindable"; inner: z.ZodType; binding: z.ZodObject }
  | { kind: "computed"; inner: z.ZodType; expression: z.ZodObject }
  | { kind: "url"; url: "link" | "image" }
  | undefined {
  const def = definitionOf(schema);
  if (def === undefined) return undefined;
  if (nodeSlots.has(def)) return { kind: "nodes" };
  const bound = bindables.get(def);
  if (bound) return { kind: "bindable", ...bound };
  const calculated = computeds.get(def);
  if (calculated) return { kind: "computed", ...calculated };
  const target = urls.get(def);
  if (target) return { kind: "url", url: target };
  return undefined;
}
