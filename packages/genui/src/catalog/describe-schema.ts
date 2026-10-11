import {
  isShape,
  jsonSchemaOf,
  kindOf,
  shapeEntries,
  type JsonSchema,
  type PropSchema,
  type PropShape,
} from "./schema.js";

function compound(text: string): string {
  return text.includes(" | ") ? `(${text})` : text;
}

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeTypeName(name: unknown): string {
  if (name === "integer") return "number";
  if (name === "string" || name === "number" || name === "boolean" || name === "null") return name;
  if (name === "array") return "any[]";
  if (name === "object") return "object";
  return "any";
}

/**
 * A short, readable type for a JSON Schema, used in the prompt and in error messages:
 * `string`, `"a" | "b"`, `{ value: string, label?: string }[]`.
 */
export function describeJsonType(json: JsonSchema): string {
  const union = json.anyOf ?? json.oneOf;
  if (Array.isArray(union)) {
    const options = union.filter(isRecord).map(describeJsonType);
    return [...new Set(options)].join(" | ");
  }
  if ("const" in json) return JSON.stringify(json.const);
  if (Array.isArray(json.enum)) return json.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (Array.isArray(json.type)) return json.type.map(describeTypeName).join(" | ");
  if (json.type === "array" || (json.type === undefined && isRecord(json.items))) {
    return isRecord(json.items) ? `${compound(describeJsonType(json.items))}[]` : "any[]";
  }
  if (json.type === "object" || (json.type === undefined && isRecord(json.properties))) {
    const properties = isRecord(json.properties) ? json.properties : {};
    const required = new Set(Array.isArray(json.required) ? json.required : []);
    const parts = Object.entries(properties)
      .filter(([, child]) => isRecord(child))
      .map(
        ([key, child]) =>
          `${key}${required.has(key) ? "" : "?"}: ${describeJsonType(child as JsonSchema)}`,
      );
    return parts.length === 0 ? "object" : `{ ${parts.join(", ")} }`;
  }
  return describeTypeName(json.type);
}

/**
 * A short, readable type for a prop schema or shape, used in the prompt and in error messages.
 * genui schemas read as `Component[]`, `string | Binding`, `number | Expression`, and `URL`.
 */
export function describeType(schema: PropSchema | PropShape): string {
  if (isShape(schema)) {
    const parts = shapeEntries(schema).map(
      (entry) => `${entry.name}${entry.optional ? "?" : ""}: ${describeType(entry.schema)}`,
    );
    return `{ ${parts.join(", ")} }`;
  }
  const kind = kindOf(schema);
  if (kind === undefined) return describeJsonType(jsonSchemaOf(schema));
  switch (kind.kind) {
    case "nodes":
      return "Component[]";
    case "bindable":
      return `${describeType(kind.inner)} | Binding`;
    case "computed":
      return `${describeType(kind.inner)} | Expression`;
    case "url":
      return kind.url === "image" ? "image URL" : "URL";
    case "list":
      return `${compound(describeType(kind.element))}[]`;
    case "oneOf":
      return kind.values.map((value) => JSON.stringify(value)).join(" | ");
    case "json":
      return describeJsonType(kind.json);
  }
}
