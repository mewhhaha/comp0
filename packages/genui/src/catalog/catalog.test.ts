import { describe, expect, it } from "vitest";
import { z } from "zod";
import { catalog } from "./catalog.js";
import { defOf, describeType, isOptional } from "./describe-schema.js";
import { bindable, computed, isNodesSchema, markerOf, nodeSlotKeys, nodes, url } from "./schema.js";

function required(name: string) {
  const entry = catalog.find((candidate) => candidate.name === name);
  if (!entry) throw new Error(`No catalog entry ${name}`);
  return Object.entries(entry.props.shape)
    .filter(([, schema]) => !isOptional(schema as z.ZodType))
    .map(([key]) => key);
}

describe("catalog", () => {
  it("lists the components models may compose", () => {
    expect(catalog.map((entry) => entry.name).sort()).toEqual(
      [
        "Accordion",
        "Alert",
        "AreaChart",
        "BarChart",
        "Button",
        "Card",
        "Checkbox",
        "CheckboxGroup",
        "CitedText",
        "ColumnChart",
        "Comparison",
        "CopyButton",
        "DatePicker",
        "Disclosure",
        "Form",
        "Grid",
        "Heading",
        "Image",
        "LineChart",
        "Link",
        "List",
        "Meter",
        "NumberField",
        "Output",
        "PieChart",
        "ProgressBar",
        "RadioGroup",
        "Select",
        "Separator",
        "Slider",
        "Stack",
        "Suggestions",
        "Switch",
        "Table",
        "Tabs",
        "Text",
        "TextArea",
        "TextField",
      ].sort(),
    );
  });

  it("gives every entry a unique name and its own schema object", () => {
    const names = catalog.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    const schemas = catalog.map((entry) => entry.props);
    expect(new Set(schemas).size).toBe(schemas.length);
  });

  it("describes every entry and every prop for a model", () => {
    for (const entry of catalog) {
      expect(entry.description.length, entry.name).toBeGreaterThan(30);
      for (const [key, schema] of Object.entries(entry.props.shape)) {
        expect((schema as z.ZodType).description, `${entry.name}.${key}`).toBeTruthy();
      }
    }
  });

  it("never lets a prop shadow the type discriminator", () => {
    for (const entry of catalog)
      expect(Object.keys(entry.props.shape), entry.name).not.toContain("type");
  });

  it("names the required props in every description of an entry that has them", () => {
    for (const entry of catalog) {
      if (required(entry.name).length === 0) continue;
      expect(entry.description, entry.name).toMatch(/Requires|Takes no required/);
    }
  });

  it("requires an accessible name in the schema", () => {
    const names: Record<string, string[]> = {
      Card: ["title"],
      Image: ["src", "alt"],
      Button: ["label"],
      Link: ["label", "href"],
      Form: ["name", "title"],
      TextField: ["label", "name"],
      TextArea: ["label", "name"],
      NumberField: ["label", "name"],
      Select: ["label", "name", "options"],
      RadioGroup: ["label", "name", "options"],
      CheckboxGroup: ["label", "name", "options"],
      Checkbox: ["label", "name"],
      Switch: ["label", "name"],
      Slider: ["label", "name"],
      DatePicker: ["label", "name"],
      Tabs: ["tabs"],
      Accordion: ["items"],
      Disclosure: ["summary"],
      Table: ["caption", "columns", "rows"],
      BarChart: ["title", "data"],
      ColumnChart: ["title", "data"],
      LineChart: ["title", "data"],
      AreaChart: ["title", "data"],
      PieChart: ["title", "data"],
      Meter: ["label", "value"],
      ProgressBar: ["label"],
      Alert: ["message"],
      Output: ["label", "value"],
      Comparison: ["caption", "options", "features"],
      CitedText: ["text", "sources"],
      Suggestions: ["label", "items"],
      CopyButton: ["label", "value"],
    };
    for (const [entry, fields] of Object.entries(names)) {
      expect(required(entry), entry).toEqual(expect.arrayContaining(fields));
    }
  });

  it("requires the accessible name inside the parts too", () => {
    const tabs = defOf(
      defOf(catalog.find((entry) => entry.name === "Tabs")!.props.shape.tabs).element,
    );
    const item = defOf(
      defOf(catalog.find((entry) => entry.name === "Accordion")!.props.shape.items).element,
    );

    expect(Object.keys(tabs.shape ?? {})).toEqual(["label", "children"]);
    expect(Object.keys(item.shape ?? {})).toEqual(["title", "children", "open"]);
    expect(
      describeType(
        catalog.find((entry) => entry.name === "Select")!.props.shape.options as z.ZodType,
      ),
    ).toBe("(string | { value: string, label?: string })[]");
  });

  it("marks the slots for nested components", () => {
    const slots = Object.fromEntries(
      catalog
        .map((entry) => [entry.name, nodeSlotKeys(entry.props)])
        .filter(([, keys]) => keys!.length > 0),
    );

    expect(slots).toEqual({
      Stack: ["children"],
      Grid: ["children"],
      Card: ["children"],
      Form: ["children"],
      Disclosure: ["children"],
    });
    expect(isNodesSchema(nodes("x").optional())).toBe(true);
    expect(isNodesSchema(z.array(z.string()))).toBe(false);
  });

  it("marks the props that accept bindings and expressions", () => {
    const marked = (kind: string) =>
      catalog.flatMap((entry) =>
        Object.entries(entry.props.shape)
          .filter(([, schema]) => markerOf(defOf(schema).innerType ?? schema)?.kind === kind)
          .map(([key]) => `${entry.name}.${key}`),
      );

    expect(marked("bindable").sort()).toEqual([
      "Checkbox.checked",
      "CheckboxGroup.value",
      "DatePicker.value",
      "NumberField.value",
      "RadioGroup.value",
      "Select.value",
      "Slider.value",
      "Switch.checked",
      "TextArea.value",
      "TextField.value",
    ]);
    expect(marked("computed").sort()).toEqual([
      "Meter.value",
      "Output.value",
      "ProgressBar.value",
      "Text.text",
    ]);
    expect(marked("url").sort()).toEqual(["Image.src", "Link.href"]);
  });
});

describe("schema markers", () => {
  it("survive describe, optional, and nesting", () => {
    expect(markerOf(bindable(z.string()).optional().describe("x"))).toBeUndefined();
    expect(markerOf(bindable(z.string()).describe("x"))?.kind).toBe("bindable");
    expect(markerOf(computed(z.number()).describe("x"))?.kind).toBe("computed");
    expect(markerOf(url("link", "x").describe("y"))?.kind).toBe("url");
    expect(markerOf(z.string())).toBeUndefined();
  });

  it("describe the shapes for a model", () => {
    expect(describeType(bindable(z.number()))).toBe("number | Binding");
    expect(describeType(computed(z.string()))).toBe("string | Expression");
    expect(describeType(nodes("x"))).toBe("Component[]");
    expect(describeType(z.enum(["a", "b"]).optional())).toBe('"a" | "b"');
    expect(describeType(z.object({ a: z.string(), b: z.number().optional() }))).toBe(
      "{ a: string, b?: number }",
    );
    expect(describeType(z.array(z.union([z.string(), z.number()])))).toBe("(string | number)[]");
    expect(describeType(z.string().nullable())).toBe("string | null");
  });
});
