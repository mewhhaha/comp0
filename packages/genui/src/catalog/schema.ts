import { type ReactNode } from "react";
import { type JsonValue } from "../json/parse.js";
import { safeHref, safeImageSrc } from "../safe.js";
import {
  type InferInput,
  type StandardIssue,
  type StandardJSONSchemaOptions,
  type StandardJSONSchemaV1,
  type StandardResult,
  type StandardSchemaV1,
} from "./standard-schema.js";

/** A JSON Schema document or fragment. */
export type JsonSchema = { [key: string]: unknown };

/**
 * The schema of one prop: any Standard Schema that can also describe itself as JSON Schema, such
 * as an ArkType `type(...)`, a zod 4.2+ schema, or a Valibot schema wrapped in
 * `toStandardJsonSchema()`. Its `.describe()` text becomes the prop's description for the model.
 */
export type PropSchema<TValue = unknown> = StandardSchemaV1<TValue> & StandardJSONSchemaV1<TValue>;

/**
 * Props as plain data: each key holds a prop schema or a nested shape, and a key that ends in `?`
 * is optional (`"gap?": ...`), as in ArkType. Key order is kept, so it is the order the prompt
 * lists them in.
 */
export type PropShape = { readonly [key: string]: PropSchema | PropShape };

type KeyName<TKey> = TKey extends `${infer TName}?` ? TName : TKey;
type OptionalKeys<TShape> = {
  [TKey in keyof TShape]: TKey extends `${string}?` ? TKey : never;
}[keyof TShape];

/** The value a prop schema or shape describes. */
export type InputOf<TSchema> = TSchema extends StandardSchemaV1
  ? InferInput<TSchema>
  : TSchema extends PropShape
    ? {
        [TKey in Exclude<keyof TSchema, OptionalKeys<TSchema>> as KeyName<TKey>]: InputOf<
          TSchema[TKey]
        >;
      } & {
        [TKey in OptionalKeys<TSchema> as KeyName<TKey>]?: InputOf<TSchema[TKey]> | null;
      }
    : never;

/** The props of a shape as a facade receives them: every prop may be missing while streaming. */
export type ShapeProps<TShape extends PropShape> = {
  [TKey in keyof TShape as KeyName<TKey>]?: InputOf<TShape[TKey]> | null | undefined;
};

/** One key of a shape: the prop name, its schema, and whether it may be left out. */
export type ShapeEntry = { name: string; schema: PropSchema | PropShape; optional: boolean };

/** Whether a value is a nested shape rather than a schema. */
export function isShape(value: unknown): value is PropShape {
  return typeof value === "object" && value !== null && !("~standard" in value);
}

/** The keys of a shape in order, with `?` taken off optional ones. */
export function shapeEntries(shape: PropShape): ShapeEntry[] {
  return Object.entries(shape).map(([key, schema]) => {
    const optional = key.endsWith("?");
    return { name: optional ? key.slice(0, -1) : key, schema, optional };
  });
}

/** The shape of the binding object a model writes: `{ "$bind": "seats", "initial": 3 }`. */
export type BindingInput<TValue = JsonValue> = { $bind: string; initial?: TValue | undefined };

/** The shape of the expression object a model writes: `{ "$expr": "seats * 12" }`. */
export type ExpressionInput = { $expr: string };

/** The longest name a binding may have. */
export const maxBindingName = 64;
/** What a binding name looks like; the same words an expression reads. */
export const bindingNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** The longest expression source. */
export const maxExpressionSource = 500;

/*
 * genui's own schemas. Prop values from a schema library describe data; these add the meaning
 * the validator, prompt, and JSON Schema need: nested components, bindings, computed values, URLs
 * the validator vets, and lists and token sets that keep their order. Each is a Standard Schema
 * itself, so it fits anywhere a prop schema does, and is recognized by identity.
 */

/** What a genui schema means. */
export type SchemaKind =
  | { kind: "nodes"; description: string }
  | { kind: "bindable"; inner: PropSchema; description: string | undefined }
  | { kind: "computed"; inner: PropSchema; description: string | undefined }
  | { kind: "url"; url: "link" | "image"; description: string }
  | { kind: "list"; element: PropSchema | PropShape; description: string | undefined }
  | { kind: "oneOf"; values: readonly (string | number)[]; description: string | undefined }
  | { kind: "json"; json: JsonSchema; description: string | undefined };

const kinds = new WeakMap<object, SchemaKind>();

/** The meaning of a genui schema, or `undefined` for a schema from a library. */
export function kindOf(schema: unknown): SchemaKind | undefined {
  return typeof schema === "object" && schema !== null ? kinds.get(schema) : undefined;
}

function supportedTarget(options: StandardJSONSchemaOptions) {
  if (options.target !== "draft-2020-12" && options.target !== "draft-07") {
    throw new Error(
      `@comp0/genui schemas generate draft-2020-12 or draft-07, not ${options.target}`,
    );
  }
}

function genuiSchema<TValue>(kind: SchemaKind): PropSchema<TValue> {
  const toJson = (options: StandardJSONSchemaOptions) => {
    supportedTarget(options);
    return jsonSchemaOf(schema);
  };
  const schema: PropSchema<TValue> = {
    "~standard": {
      version: 1,
      vendor: "comp0-genui",
      validate: (value: unknown) => validateStructure(schema, value) as StandardResult<TValue>,
      jsonSchema: { input: toJson, output: toJson },
    },
  };
  kinds.set(schema, kind);
  return schema;
}

/**
 * A slot for nested components: an array of component objects. The renderer turns the validated
 * nodes into React elements, so a facade receives a plain `ReactNode`.
 */
export function nodes(description: string): PropSchema<ReactNode> {
  return genuiSchema({ kind: "nodes", description });
}

/**
 * A value a control can read and write through a shared name: either the literal value or
 * `{ "$bind": name, "initial"?: value }`. Expressions elsewhere in the response read the name.
 */
export function bindable<TInner extends PropSchema>(
  inner: TInner,
  description?: string,
): PropSchema<InputOf<TInner> | BindingInput<InputOf<TInner>>> {
  return genuiSchema({ kind: "bindable", inner, description });
}

/** A value that is either literal or `{ "$expr": "seats * 12" }`, computed from bound names. */
export function computed<TInner extends PropSchema>(
  inner: TInner,
  description?: string,
): PropSchema<InputOf<TInner> | ExpressionInput> {
  return genuiSchema({ kind: "computed", inner, description });
}

/**
 * A URL a person may follow (`link`) or an image source (`image`). The validator rejects every
 * unsafe scheme before the value reaches a component.
 */
export function url(kind: "link" | "image", description: string): PropSchema<string> {
  return genuiSchema({ kind: "url", url: kind, description });
}

/**
 * A list of values or of shapes. Use it where list items hold genui schemas (a tab's `children`,
 * a source's `url`); a list of plain data can come from your schema library as well. An item that
 * does not fit is left out rather than failing the list, so a list renders while it streams.
 */
export function list<TElement extends PropSchema | PropShape>(
  element: TElement,
  description?: string,
): PropSchema<InputOf<TElement>[]> {
  return genuiSchema({ kind: "list", element, description });
}

/**
 * One of a few literal values, listed in the order given. Schema libraries may sort the members
 * of a union, which reads poorly for scales such as `"xs" | "sm" | "md"`.
 */
export function oneOf<const TValues extends readonly (string | number)[]>(
  values: TValues,
  description?: string,
): PropSchema<TValues[number]> {
  return genuiSchema({ kind: "oneOf", values, description });
}

/**
 * The JSON Schema keywords a precompiled prop schema may use: the ones the validator enforces
 * while it walks a response. A schema that needs any other rule (a format, a range, a pattern)
 * must stay a schema-library value so its own `validate` can apply it.
 */
export const structuralKeywords: ReadonlySet<string> = new Set([
  "type",
  "enum",
  "const",
  "anyOf",
  "oneOf",
  "items",
  "properties",
  "required",
  "additionalProperties",
  "description",
]);

/**
 * A prop schema from a static JSON Schema that uses only {@link structuralKeywords}. The built-in
 * props are written with ArkType and precompiled to these, so no schema library runs (or ships)
 * at runtime.
 */
export function fromJsonSchema<TValue>(json: JsonSchema): PropSchema<TValue> {
  const description = typeof json.description === "string" ? json.description : undefined;
  return genuiSchema({ kind: "json", json, description });
}

/* JSON Schema */

const libraryJson = new WeakMap<object, JsonSchema>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Replaces local `$ref`s with the definitions they point to, so a schema library's output can be
 * embedded in a larger document. A recursive definition becomes `{}` (any value).
 */
function inlineReferences(root: JsonSchema): JsonSchema {
  const definitions = {
    ...(isRecord(root.definitions) ? root.definitions : {}),
    ...(isRecord(root.$defs) ? root.$defs : {}),
  };
  const visit = (value: unknown, resolving: readonly string[]): unknown => {
    if (Array.isArray(value)) return value.map((item) => visit(item, resolving));
    if (!isRecord(value)) return value;
    const reference = typeof value.$ref === "string" ? value.$ref : undefined;
    const name = reference?.match(/^#\/(?:\$defs|definitions)\/(.+)$/)?.[1];
    if (name !== undefined) {
      const { $ref: _reference, ...siblings } = value;
      const target = definitions[name];
      if (!isRecord(target) || resolving.includes(name)) return visit(siblings, resolving);
      return { ...(visit(target, [...resolving, name]) as JsonSchema), ...siblings };
    }
    const result: JsonSchema = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "$schema" || key === "$defs" || key === "definitions" || key === "$id") continue;
      result[key] = visit(item, resolving);
    }
    return result;
  };
  return visit(root, []) as JsonSchema;
}

/** A library schema's JSON Schema, self-contained; `{}` when the library cannot produce one. */
function libraryJsonSchema(schema: PropSchema): JsonSchema {
  let json = libraryJson.get(schema);
  if (json === undefined) {
    try {
      json = inlineReferences(schema["~standard"].jsonSchema.input({ target: "draft-2020-12" }));
    } catch {
      json = {};
    }
    libraryJson.set(schema, json);
  }
  return json;
}

function withDescription(json: JsonSchema, description: string | undefined): JsonSchema {
  return description === undefined ? json : { ...json, description };
}

function bindingJson(inner: JsonSchema): JsonSchema {
  const { description: _description, ...initial } = inner;
  return {
    type: "object",
    properties: {
      $bind: {
        type: "string",
        maxLength: maxBindingName,
        pattern: bindingNamePattern.source,
        description: "Name of the shared value this control reads and writes, such as seats.",
      },
      initial: {
        ...initial,
        description: "Starting value of the name until the person changes it.",
      },
    },
    required: ["$bind"],
    additionalProperties: false,
  };
}

const expressionJson: JsonSchema = {
  type: "object",
  properties: {
    $expr: {
      type: "string",
      maxLength: maxExpressionSource,
      description: "An expression over bound names, such as seats * 12 or round(price * 1.2, 2).",
    },
  },
  required: ["$expr"],
  additionalProperties: false,
};

/**
 * The JSON Schema of a prop schema or shape. `nodeItems` is the schema of one nested component,
 * any value by default; the response schema passes a reference to its component union.
 */
export function jsonSchemaOf(
  schema: PropSchema | PropShape,
  nodeItems: JsonSchema = {},
): JsonSchema {
  if (isShape(schema)) {
    const entries = shapeEntries(schema);
    return {
      type: "object",
      properties: Object.fromEntries(
        entries.map((entry) => [entry.name, jsonSchemaOf(entry.schema, nodeItems)]),
      ),
      required: entries.filter((entry) => !entry.optional).map((entry) => entry.name),
      additionalProperties: false,
    };
  }
  const kind = kindOf(schema);
  if (kind === undefined) return libraryJsonSchema(schema);
  switch (kind.kind) {
    case "nodes":
      return { type: "array", items: nodeItems, description: kind.description };
    case "bindable": {
      const inner = jsonSchemaOf(kind.inner, nodeItems);
      return withDescription({ anyOf: [inner, bindingJson(inner)] }, kind.description);
    }
    case "computed":
      return withDescription(
        { anyOf: [jsonSchemaOf(kind.inner, nodeItems), expressionJson] },
        kind.description,
      );
    case "url":
      return { type: "string", description: kind.description };
    case "list":
      return withDescription(
        { type: "array", items: jsonSchemaOf(kind.element, nodeItems) },
        kind.description,
      );
    case "json":
      return kind.json;
    case "oneOf": {
      const strings = kind.values.every((value) => typeof value === "string");
      const json: JsonSchema = strings
        ? { type: "string", enum: [...kind.values] }
        : { enum: [...kind.values] };
      return withDescription(json, kind.description);
    }
  }
}

/** The description of a prop: the genui schema's, or the one the library put in its JSON Schema. */
export function descriptionOf(schema: PropSchema | PropShape): string | undefined {
  if (isShape(schema)) return undefined;
  const kind = kindOf(schema);
  if (kind !== undefined) {
    if (kind.description !== undefined || kind.kind === "nodes" || kind.kind === "url") {
      return kind.description;
    }
    if (kind.kind === "bindable" || kind.kind === "computed") return descriptionOf(kind.inner);
    return undefined;
  }
  const description = libraryJsonSchema(schema).description;
  return typeof description === "string" ? description : undefined;
}

/* Standalone validation of genui schemas, for callers that use them as Standard Schemas. The
 * renderer does not call this: it walks the schemas itself so it can render partial values. */

type Issues = StandardIssue[];

function structureIssues(
  schema: PropSchema | PropShape,
  value: unknown,
  path: PropertyKey[],
  issues: Issues,
): void {
  if (isShape(schema)) {
    if (!isRecord(value)) {
      issues.push({ message: "expected an object", path });
      return;
    }
    for (const entry of shapeEntries(schema)) {
      const item = Object.hasOwn(value, entry.name) ? value[entry.name] : undefined;
      if (item === undefined || (item === null && entry.optional)) {
        if (!entry.optional)
          issues.push({ message: `${entry.name} is required`, path: [...path, entry.name] });
        continue;
      }
      structureIssues(entry.schema, item, [...path, entry.name], issues);
    }
    return;
  }
  const kind = kindOf(schema);
  if (kind === undefined) {
    const result = schema["~standard"].validate(value);
    if (result instanceof Promise) return;
    for (const issue of result.issues ?? []) {
      issues.push({ message: issue.message, path: [...path, ...(issue.path ?? [])] });
    }
    return;
  }
  switch (kind.kind) {
    case "nodes":
      if (!Array.isArray(value)) issues.push({ message: "expected an array of components", path });
      return;
    case "bindable": {
      if (isRecord(value) && Object.hasOwn(value, "$bind")) {
        const name = value.$bind;
        if (
          typeof name !== "string" ||
          name.length > maxBindingName ||
          !bindingNamePattern.test(name)
        ) {
          issues.push({
            message: "expected a binding name of letters, digits, and underscores",
            path: [...path, "$bind"],
          });
        }
        return;
      }
      structureIssues(kind.inner, value, path, issues);
      return;
    }
    case "computed":
      if (isRecord(value) && Object.hasOwn(value, "$expr")) {
        if (typeof value.$expr !== "string")
          issues.push({ message: "expected an expression string", path: [...path, "$expr"] });
        return;
      }
      structureIssues(kind.inner, value, path, issues);
      return;
    case "url": {
      const safe = kind.url === "image" ? safeImageSrc(value) : safeHref(value);
      if (safe === undefined) issues.push({ message: `expected a safe ${kind.url} URL`, path });
      return;
    }
    case "list":
      if (!Array.isArray(value)) {
        issues.push({ message: "expected an array", path });
        return;
      }
      value.forEach((item, index) => structureIssues(kind.element, item, [...path, index], issues));
      return;
    case "oneOf":
      if (!kind.values.includes(value as string | number)) {
        issues.push({
          message: `expected one of ${kind.values.map((item) => JSON.stringify(item)).join(", ")}`,
          path,
        });
      }
      return;
    case "json":
      jsonIssues(kind.json, value, path, issues);
  }
}

function matchesType(type: unknown, value: unknown): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    case "array":
      return Array.isArray(value);
    case "object":
      return isRecord(value);
    default:
      return true;
  }
}

/** Checks a value against a structural JSON Schema, as {@link fromJsonSchema} schemas do. */
function jsonIssues(json: JsonSchema, value: unknown, path: PropertyKey[], issues: Issues): void {
  const union = json.anyOf ?? json.oneOf;
  if (Array.isArray(union)) {
    const fits = union.filter(isRecord).some((option) => {
      const optionIssues: Issues = [];
      jsonIssues(option, value, path, optionIssues);
      return optionIssues.length === 0;
    });
    if (!fits) issues.push({ message: "expected one of the allowed shapes", path });
    return;
  }
  if ("const" in json && value !== json.const) {
    issues.push({ message: `expected ${JSON.stringify(json.const)}`, path });
    return;
  }
  if (Array.isArray(json.enum) && !json.enum.includes(value)) {
    issues.push({
      message: `expected one of ${json.enum.map((item) => JSON.stringify(item)).join(", ")}`,
      path,
    });
    return;
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  if (json.type !== undefined && !types.some((type) => matchesType(type, value))) {
    issues.push({ message: `expected ${types.join(" or ")}`, path });
    return;
  }
  if (Array.isArray(value) && isRecord(json.items)) {
    const items = json.items;
    value.forEach((item, index) => jsonIssues(items, item, [...path, index], issues));
  }
  if (isRecord(value) && isRecord(json.properties)) {
    const required = new Set(Array.isArray(json.required) ? json.required : []);
    for (const [key, child] of Object.entries(json.properties)) {
      const item = Object.hasOwn(value, key) ? value[key] : undefined;
      if (item === undefined || (item === null && !required.has(key))) {
        if (required.has(key)) issues.push({ message: `${key} is required`, path: [...path, key] });
        continue;
      }
      if (isRecord(child)) jsonIssues(child, item, [...path, key], issues);
    }
  }
}

function validateStructure(schema: PropSchema, value: unknown): StandardResult<unknown> {
  const issues: Issues = [];
  structureIssues(schema, value, [], issues);
  return issues.length === 0 ? { value } : { issues };
}
