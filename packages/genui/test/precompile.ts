import { readFileSync } from "node:fs";
import { format } from "oxfmt";
import {
  isShape,
  jsonSchemaOf,
  kindOf,
  shapeEntries,
  structuralKeywords,
  type JsonSchema,
  type PropSchema,
  type PropShape,
} from "../src/catalog/schema.js";

/*
 * Precompiles the built-in prop shapes. They are written with ArkType in `*.props.ark.ts`; this
 * turns every ArkType value into a static JSON Schema (`fromJsonSchema`) and writes the genui
 * schemas back as calls, so the shapes the package ships need no schema library at runtime.
 */

function isRecord(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parenthesize(type: string): string {
  return type.includes(" | ") ? `(${type})` : type;
}

/** A TypeScript type for a structural JSON Schema. */
function typeOf(json: JsonSchema): string {
  const union = json.anyOf ?? json.oneOf;
  if (Array.isArray(union)) return [...new Set(union.filter(isRecord).map(typeOf))].join(" | ");
  if ("const" in json) return JSON.stringify(json.const);
  if (Array.isArray(json.enum)) return json.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (Array.isArray(json.type)) {
    return json.type.map((type: unknown) => typeOf({ ...json, type })).join(" | ");
  }
  let type = json.type;
  if (type === undefined && isRecord(json.properties)) type = "object";
  if (type === undefined && isRecord(json.items)) type = "array";
  switch (type) {
    case "string":
    case "boolean":
    case "null":
      return type;
    case "number":
    case "integer":
      return "number";
    case "array":
      return isRecord(json.items) ? `${parenthesize(typeOf(json.items))}[]` : "unknown[]";
    case "object": {
      const properties = isRecord(json.properties) ? json.properties : {};
      const required = new Set(Array.isArray(json.required) ? json.required : []);
      const members = Object.entries(properties)
        .filter(([, child]) => isRecord(child))
        .map(
          ([key, child]) =>
            `${JSON.stringify(key)}${required.has(key) ? "" : "?"}: ${typeOf(child as JsonSchema)}`,
        );
      return members.length === 0 ? "Record<string, unknown>" : `{ ${members.join("; ")} }`;
    }
    default:
      return "unknown";
  }
}

/** Throws when a JSON Schema needs a rule the validator does not enforce while it walks. */
function assertStructural(json: unknown, where: string): void {
  if (Array.isArray(json)) {
    for (const item of json) assertStructural(item, where);
    return;
  }
  if (!isRecord(json)) return;
  for (const [key, value] of Object.entries(json)) {
    if (!structuralKeywords.has(key)) {
      throw new Error(
        `${where} uses the JSON Schema keyword "${key}", which a precompiled prop cannot enforce. Keep built-in props to structure (types, literals, arrays, objects, unions).`,
      );
    }
    if (key === "properties" && isRecord(value)) {
      for (const [name, child] of Object.entries(value))
        assertStructural(child, `${where}.${name}`);
    } else if (key !== "enum" && key !== "const" && key !== "required" && key !== "description") {
      assertStructural(value, where);
    }
  }
}

function text(value: string | undefined): string {
  return value === undefined ? "" : `, ${JSON.stringify(value)}`;
}

function emit(schema: PropSchema | PropShape, where: string, used: Set<string>): string {
  if (isShape(schema)) {
    const members = shapeEntries(schema).map((entry) => {
      const key = entry.optional ? `${entry.name}?` : entry.name;
      return `${JSON.stringify(key)}: ${emit(entry.schema, `${where}.${entry.name}`, used)}`;
    });
    return `{ ${members.join(", ")} }`;
  }
  const kind = kindOf(schema);
  if (kind === undefined || kind.kind === "json") {
    const json = jsonSchemaOf(schema);
    assertStructural(json, where);
    used.add("fromJsonSchema");
    return `fromJsonSchema<${typeOf(json)}>(${JSON.stringify(json)})`;
  }
  used.add(kind.kind);
  switch (kind.kind) {
    case "nodes":
      return `nodes(${JSON.stringify(kind.description)})`;
    case "url":
      return `url(${JSON.stringify(kind.url)}, ${JSON.stringify(kind.description)})`;
    case "bindable":
    case "computed":
      return `${kind.kind}(${emit(kind.inner, where, used)}${text(kind.description)})`;
    case "list":
      return `list(${emit(kind.element, `${where}[]`, used)}${text(kind.description)})`;
    case "oneOf":
      return `oneOf(${JSON.stringify(kind.values)}${text(kind.description)})`;
  }
}

const {
  ignorePatterns: _ignored,
  $schema: _schema,
  ...formatOptions
} = JSON.parse(readFileSync(".oxfmtrc.json", "utf8")) as Record<string, unknown>;

/** The precompiled module for one `*.props.ark.ts` module: every exported shape, in order. */
export async function precompileProps(source: string, exports: Record<string, unknown>) {
  const used = new Set<string>();
  const declarations = Object.entries(exports)
    .filter((entry): entry is [string, PropShape] => isShape(entry[1]))
    .map(([name, shape]) => `export const ${name} = ${emit(shape, name, used)};`);
  const imports = [...used].sort().join(", ");
  const code = [
    `// Generated from ${source} by \`pnpm test -u\` (src/facades/props.test.ts). Do not edit:`,
    "// change the ArkType source and regenerate.",
    `import { ${imports} } from "../catalog/schema.js";`,
    "",
    ...declarations,
  ].join("\n");
  const result = await format("props.ts", code, formatOptions);
  if (result.errors.length > 0)
    throw new Error(result.errors.map((error) => error.message).join("\n"));
  return result.code;
}
