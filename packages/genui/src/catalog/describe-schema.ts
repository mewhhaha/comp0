import { type z } from "zod";
import { markerOf } from "./schema.js";

type Def = {
  type?: string;
  shape?: Record<string, z.ZodType>;
  element?: z.ZodType;
  options?: z.ZodType[];
  entries?: Record<string, string>;
  values?: unknown[];
  innerType?: z.ZodType;
  getter?: () => z.ZodType;
};

/** The internal definition of a Zod schema; the validator and the generators read it. */
export function defOf(schema: unknown): Def {
  return ((schema as { _zod?: { def?: Def } })._zod?.def ?? {}) as Def;
}

/** Whether a schema accepts `undefined` (is optional). */
export function isOptional(schema: z.ZodType): boolean {
  const def = defOf(schema);
  if (def.type === "optional" || def.type === "default") return true;
  if ((def.type === "readonly" || def.type === "nullable") && def.innerType) {
    return isOptional(def.innerType);
  }
  return false;
}

/** The schema without `optional`, `nullable`, `default`, and `readonly` wrappers. */
export function unwrap(schema: z.ZodType): z.ZodType {
  const def = defOf(schema);
  if (
    (def.type === "optional" ||
      def.type === "nullable" ||
      def.type === "default" ||
      def.type === "readonly") &&
    def.innerType
  ) {
    return unwrap(def.innerType);
  }
  return schema;
}

function compound(text: string): string {
  return text.includes(" | ") ? `(${text})` : text;
}

/**
 * A short, readable type for a schema, used in the prompt and in error messages:
 * `string`, `"a" | "b"`, `{ value: string, label?: string }[]`.
 */
export function describeType(schema: z.ZodType): string {
  const marker = markerOf(schema);
  if (marker?.kind === "nodes") return "Component[]";
  if (marker?.kind === "bindable") return `${describeType(marker.inner)} | Binding`;
  if (marker?.kind === "computed") return `${describeType(marker.inner)} | Expression`;
  if (marker?.kind === "url") return marker.url === "image" ? "image URL" : "URL";
  const def = defOf(schema);
  switch (def.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "unknown":
      return "any";
    case "enum":
      return Object.values(def.entries ?? {})
        .map((value) => JSON.stringify(value))
        .join(" | ");
    case "literal":
      return (def.values ?? []).map((value) => JSON.stringify(value)).join(" | ");
    case "array":
      return `${compound(describeType(def.element as z.ZodType))}[]`;
    case "union":
      return (def.options ?? []).map(describeType).join(" | ");
    case "object": {
      const parts = Object.entries(def.shape ?? {}).map(
        ([key, child]) => `${key}${isOptional(child) ? "?" : ""}: ${describeType(child)}`,
      );
      return `{ ${parts.join(", ")} }`;
    }
    case "optional":
    case "default":
    case "readonly":
      return describeType(def.innerType as z.ZodType);
    case "nullable":
      return `${describeType(def.innerType as z.ZodType)} | null`;
    case "lazy":
      return describeType((def.getter as () => z.ZodType)());
    default:
      return "any";
  }
}
