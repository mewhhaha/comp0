import { describe, expect, it } from "vitest";
import { z } from "zod";
import { catalog } from "../catalog/catalog.js";
import { defineEntry } from "../catalog/types.js";
import { answers, hostile } from "../../test/answers/index.js";
import { kitchenSink } from "../../test/fixtures.js";
import { genuiPromptExamples } from "../prompt/prompt.js";
import { validateResponse } from "../validate/validate.js";
import { responseJsonSchema, type JsonSchema } from "./json-schema.js";

type Schema = JsonSchema & {
  properties?: Record<string, JsonSchema>;
  required?: string[];
  $defs: Record<string, Schema>;
  anyOf?: JsonSchema[];
};

const schema = responseJsonSchema() as Schema;
const strict = responseJsonSchema({ strict: true }) as Schema;

function typesOf(node: JsonSchema): string[] {
  if (Array.isArray(node.type)) return node.type as string[];
  if (typeof node.type === "string") return [node.type];
  return [];
}

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/** A small JSON Schema checker for the keywords the generator emits. */
function conforms(value: unknown, node: JsonSchema, root: Schema, path = ""): string[] {
  if (typeof node.$ref === "string") {
    const target = root.$defs[node.$ref.replace("#/$defs/", "")];
    return target ? conforms(value, target, root, path) : [`${path}: unresolved ${node.$ref}`];
  }
  if (Array.isArray(node.anyOf)) {
    const failures = (node.anyOf as JsonSchema[]).map((option) =>
      conforms(value, option, root, path),
    );
    return failures.some((list) => list.length === 0) ? [] : [`${path}: matches no option`];
  }
  if (node.const !== undefined)
    return value === node.const ? [] : [`${path}: expected ${String(node.const)}`];
  if (Array.isArray(node.enum)) return node.enum.includes(value) ? [] : [`${path}: not in enum`];
  const problems: string[] = [];
  const types = typesOf(node);
  const actual = jsonType(value);
  if (
    types.length > 0 &&
    !types.includes(actual) &&
    !(actual === "number" && types.includes("integer"))
  ) {
    return [`${path}: expected ${types.join("|")}, got ${actual}`];
  }
  if (actual === "array") {
    for (const [index, item] of (value as unknown[]).entries()) {
      if (node.items)
        problems.push(...conforms(item, node.items as JsonSchema, root, `${path}/${index}`));
    }
  }
  if (actual === "object") {
    const properties = (node.properties ?? {}) as Record<string, JsonSchema>;
    const record = value as Record<string, unknown>;
    for (const key of (node.required ?? []) as string[]) {
      if (!(key in record)) problems.push(`${path}: missing ${key}`);
    }
    for (const [key, item] of Object.entries(record)) {
      if (properties[key])
        problems.push(...conforms(item, properties[key]!, root, `${path}/${key}`));
      else if (node.additionalProperties === false) problems.push(`${path}: unexpected ${key}`);
    }
  }
  return problems;
}

describe("responseJsonSchema", () => {
  it("describes the root component and defines every component once", () => {
    expect(schema.$schema).toContain("2020-12");
    expect(schema.type).toBe("object");
    expect(schema.properties?.type).toEqual({ const: "Stack" });
    for (const entry of catalog) {
      const definition = schema.$defs[entry.name]!;
      expect(definition.description, entry.name).toBe(entry.description);
      expect(definition.properties?.type, entry.name).toEqual({ const: entry.name });
      expect(definition.required?.[0], entry.name).toBe("type");
      expect(definition.additionalProperties, entry.name).toBe(false);
      expect(Object.keys(definition.properties ?? {}), entry.name).toEqual([
        "type",
        ...Object.keys(entry.props.shape),
      ]);
    }
  });

  it("lists exactly the required props of each component", () => {
    for (const entry of catalog) {
      const expected = Object.entries(entry.props.shape)
        .filter(([, prop]) => !(prop as z.ZodType).safeParse(undefined).success)
        .map(([key]) => key);
      expect(schema.$defs[entry.name]!.required, entry.name).toEqual(["type", ...expected]);
    }
  });

  it("is recursive through Node", () => {
    const node = schema.$defs.Node!;
    const refs = (node.anyOf ?? []).map((item) => item.$ref);

    expect(refs).toEqual(catalog.map((entry) => `#/$defs/${entry.name}`));
    const children = schema.$defs.Stack!.properties!.children!;
    expect(children).toMatchObject({ type: "array", items: { $ref: "#/$defs/Node" } });
    const tabs = schema.$defs.Tabs!.properties!.tabs as { items: Schema };
    expect(tabs.items.properties!.children).toMatchObject({
      type: "array",
      items: { $ref: "#/$defs/Node" },
    });
    expect(JSON.stringify(schema)).not.toContain("$defs/undefined");
  });

  it("describes bindings, expressions, and parts", () => {
    const slider = schema.$defs.Slider!.properties!.value as Schema;
    expect(slider.anyOf?.[0]).toMatchObject({ type: "number" });
    expect(slider.anyOf?.[1]).toMatchObject({
      type: "object",
      required: ["$bind"],
      properties: { $bind: { type: "string" }, initial: { type: "number" } },
    });
    const output = schema.$defs.Output!.properties!.value as Schema;
    expect(output.anyOf?.[1]).toMatchObject({ required: ["$expr"] });
    const options = schema.$defs.Select!.properties!.options as { items: Schema };
    expect(options.items.anyOf?.[0]).toMatchObject({ type: "string" });
  });

  it("accepts every valid answer and rejects wrong shapes", () => {
    for (const value of [
      ...answers.map((answer) => answer.value),
      kitchenSink,
      ...genuiPromptExamples,
    ]) {
      expect(conforms(value, schema, schema)).toEqual([]);
    }
    expect(conforms({ type: "Text" }, schema.$defs.Text!, schema).length).toBeGreaterThan(0);
    expect(conforms({ type: "Text", text: "x", extra: 1 }, schema.$defs.Text!, schema)).toContain(
      ": unexpected extra",
    );
    expect(conforms(hostile.value, schema, schema).length).toBeGreaterThan(0);
  });

  it("can start from another root and use a custom catalog", () => {
    const Shout = defineEntry({
      name: "Shout",
      group: "Layout",
      description: "Loud text. Requires text.",
      props: z.object({
        text: z.string().describe("What to shout."),
        volume: z.number().optional().describe("How loud."),
      }),
      component: () => null,
    });
    const custom = responseJsonSchema({ catalog: [Shout], root: "Shout" }) as Schema;

    expect(custom.properties?.type).toEqual({ const: "Shout" });
    expect(Object.keys(custom.$defs).sort()).toEqual(["Node", "Shout"]);
    expect(responseJsonSchema({ catalog: [Shout], root: "Nope" }).properties).toBeDefined();
    expect(() => responseJsonSchema({ catalog: [] })).toThrow();
  });
});

describe("responseJsonSchema strict", () => {
  function objects(node: unknown, found: Schema[] = []): Schema[] {
    if (Array.isArray(node)) node.forEach((item) => objects(item, found));
    else if (typeof node === "object" && node !== null) {
      const record = node as Schema;
      if (record.properties !== undefined) found.push(record);
      Object.values(record).forEach((item) => objects(item, found));
    }
    return found;
  }

  it("requires every property, forbids extras, and makes optionals nullable", () => {
    const all = objects(strict);

    expect(all.length).toBeGreaterThan(50);
    for (const object of all) {
      expect(object.required, JSON.stringify(object).slice(0, 80)).toEqual(
        Object.keys(object.properties!),
      );
      expect(object.additionalProperties).toBe(false);
    }
    const text = strict.$defs.Text!;
    expect(text.properties!.text).not.toHaveProperty(
      "anyOf",
      expect.arrayContaining([{ type: "null" }]),
    );
    expect(text.properties!.tone).toMatchObject({
      anyOf: [{ enum: expect.any(Array) }, { type: "null" }],
    });
  });

  it("uses enum for the type, drops keywords strict mode rejects, and keeps the root an object", () => {
    const keys = new Set<string>();
    const collect = (node: unknown) => {
      if (Array.isArray(node)) node.forEach(collect);
      else if (typeof node === "object" && node !== null) {
        for (const [key, item] of Object.entries(node)) {
          if (key !== "properties" && key !== "$defs") keys.add(key);
          collect(key === "properties" || key === "$defs" ? Object.values(item as object) : item);
        }
      }
    };
    collect(strict);

    expect(strict.type).toBe("object");
    expect(strict.anyOf).toBeUndefined();
    expect(strict.properties?.type).toEqual({ enum: ["Stack"] });
    for (const keyword of [
      "minLength",
      "maxLength",
      "pattern",
      "const",
      "format",
      "default",
      "$schema",
      "minItems",
    ]) {
      expect(keys.has(keyword), keyword).toBe(false);
    }
  });

  it("accepts what the model writes to it, with nulls for what it leaves out", () => {
    const nulls = (node: Schema): unknown => {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(node.properties!)) result[key] = null;
      return result;
    };
    const response = {
      ...(nulls(strict) as object),
      type: "Stack",
      children: [
        {
          ...(nulls(strict.$defs.Text!) as object),
          type: "Text",
          text: "Hello",
        },
        {
          ...(nulls(strict.$defs.Slider!) as object),
          type: "Slider",
          label: "Seats",
          name: "seats",
          value: { $bind: "seats", initial: 3 },
        },
      ],
    };

    expect(conforms(response, strict, strict)).toEqual([]);
    const validated = validateResponse(response);
    expect(validated.errors).toEqual([]);
    expect(validated.bindings.get("seats")).toBe(3);
  });
});
