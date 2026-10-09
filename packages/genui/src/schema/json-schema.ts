import { z } from "zod";
import { catalog as defaultCatalog } from "../catalog/catalog.js";
import { isNodesSchema } from "../catalog/schema.js";
import { type CatalogEntry } from "../catalog/types.js";

/** A JSON Schema document (draft 2020-12). */
export type JsonSchema = { [key: string]: unknown };

export type ResponseSchemaOptions = {
  /** The components a response may use; defaults to the built-in catalog. */
  catalog?: readonly CatalogEntry[] | undefined;
  /** The component a response is: the root of the schema. Defaults to `"Stack"`. */
  root?: string | undefined;
  /**
   * Shape the schema for strict structured outputs (OpenAI-style `strict: true`): every
   * property is required, optional ones are nullable, `additionalProperties` is false, and
   * keywords strict mode rejects are removed. The validator accepts `null` for an optional prop,
   * so a response written to the strict schema is valid as is.
   */
  strict?: boolean | undefined;
};

const nodeReference = "#/$defs/Node";

function entrySchema(entry: CatalogEntry): JsonSchema {
  const generated = z.toJSONSchema(entry.props, {
    target: "draft-2020-12",
    io: "input",
    unrepresentable: "any",
    override(context) {
      if (!isNodesSchema(context.zodSchema)) return;
      const { description } = context.jsonSchema;
      for (const key of Object.keys(context.jsonSchema)) delete context.jsonSchema[key];
      context.jsonSchema.type = "array";
      context.jsonSchema.items = { $ref: nodeReference };
      if (description !== undefined) context.jsonSchema.description = description;
    },
  }) as JsonSchema;
  const properties = (generated.properties ?? {}) as Record<string, unknown>;
  const required = (generated.required ?? []) as string[];
  return {
    type: "object",
    description: entry.description,
    properties: { type: { const: entry.name }, ...properties },
    required: ["type", ...required],
    additionalProperties: false,
  };
}

/** Keywords that strict structured outputs do not accept. */
const unsupportedInStrict = new Set([
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "default",
  "$schema",
]);

function strictify(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strictify);
  if (typeof value !== "object" || value === null) return value;
  const source = value as JsonSchema;
  const result: JsonSchema = {};
  for (const [key, item] of Object.entries(source)) {
    if (unsupportedInStrict.has(key)) continue;
    if (key === "properties" || key === "$defs") {
      result[key] = Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([name, child]) => [
          name,
          strictify(child),
        ]),
      );
    } else if (key === "const") {
      result.enum = [item];
    } else {
      result[key] = strictify(item);
    }
  }
  const properties = result.properties as Record<string, JsonSchema> | undefined;
  if (result.type === "object" || properties !== undefined) {
    const originallyRequired = new Set((source.required ?? []) as string[]);
    const entries = Object.entries(properties ?? {});
    result.properties = Object.fromEntries(
      entries.map(([name, child]) => [
        name,
        originallyRequired.has(name) ? child : { anyOf: [child, { type: "null" }] },
      ]),
    );
    result.required = entries.map(([name]) => name);
    result.additionalProperties = false;
  }
  return result;
}

/**
 * The JSON Schema of a response: one component object, recursive through `$defs` (`Node` is any
 * component, and every component has its own definition). Give it to a provider's structured
 * output or tool-calling feature so the model can only produce shapes the renderer accepts.
 *
 * Constraints a schema cannot express (unsafe URLs, expression syntax, duplicate names) are still
 * checked by the validator, which also sanitizes everything it renders.
 */
export function responseJsonSchema(options: ResponseSchemaOptions = {}): JsonSchema {
  const entries = options.catalog ?? defaultCatalog;
  const rootName = options.root ?? "Stack";
  const root = entries.find((entry) => entry.name === rootName) ?? entries[0];
  if (root === undefined) throw new Error("responseJsonSchema needs at least one catalog entry.");
  const definitions: Record<string, JsonSchema> = {};
  for (const entry of entries) definitions[entry.name] = entrySchema(entry);
  definitions.Node = {
    description: "Any component.",
    anyOf: entries.map((entry) => ({ $ref: `#/$defs/${entry.name}` })),
  };
  const schema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "GenUI response",
    ...definitions[root.name],
    $defs: definitions,
  };
  schema.description = `One ${root.name} component object. ${root.description}`;
  return options.strict === true ? (strictify(schema) as JsonSchema) : schema;
}
