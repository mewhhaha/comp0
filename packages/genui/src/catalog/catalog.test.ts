import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { catalog } from "./catalog.js";
import { describeType } from "./describe-schema.js";
import {
  bindable,
  computed,
  descriptionOf,
  isShape,
  kindOf,
  list,
  nodes,
  oneOf,
  shapeEntries,
  url,
  type PropShape,
} from "./schema.js";

function entryNamed(name: string) {
  const entry = catalog.find((candidate) => candidate.name === name);
  if (!entry) throw new Error(`No catalog entry ${name}`);
  return entry;
}

function required(name: string) {
  return shapeEntries(entryNamed(name).props)
    .filter((prop) => !prop.optional)
    .map((prop) => prop.name);
}

function propSchema(name: string, prop: string) {
  return shapeEntries(entryNamed(name).props).find((entry) => entry.name === prop)!.schema;
}

function listShape(name: string, prop: string): PropShape {
  const kind = kindOf(propSchema(name, prop));
  if (kind?.kind !== "list" || !isShape(kind.element))
    throw new Error(`${name}.${prop} is no list`);
  return kind.element;
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
        "Query",
        "RadioGroup",
        "Select",
        "Separator",
        "Slider",
        "Slot",
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
      for (const prop of shapeEntries(entry.props)) {
        expect(descriptionOf(prop.schema), `${entry.name}.${prop.name}`).toBeTruthy();
      }
    }
  });

  it("never lets a prop shadow the type discriminator", () => {
    for (const entry of catalog)
      expect(
        shapeEntries(entry.props).map((prop) => prop.name),
        entry.name,
      ).not.toContain("type");
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
    const names = (shape: PropShape) =>
      shapeEntries(shape).map((prop) => `${prop.name}${prop.optional ? "?" : ""}`);
    expect(names(listShape("Tabs", "tabs"))).toEqual(["label", "children"]);
    expect(names(listShape("Accordion", "items"))).toEqual(["title", "open?", "children"]);
    expect(describeType(propSchema("Select", "options"))).toBe(
      "(string | { value: string, label?: string })[]",
    );
  });

  it("marks the slots for nested components", () => {
    const slots = Object.fromEntries(
      catalog
        .map((entry) => [
          entry.name,
          shapeEntries(entry.props)
            .filter((prop) => kindOf(prop.schema)?.kind === "nodes")
            .map((prop) => prop.name),
        ])
        .filter(([, keys]) => keys!.length > 0),
    );

    expect(slots).toEqual({
      Stack: ["children"],
      Grid: ["children"],
      Card: ["children"],
      Form: ["children"],
      Disclosure: ["children"],
    });
  });

  it("marks the props that accept bindings and expressions", () => {
    const marked = (kind: string) =>
      catalog.flatMap((entry) =>
        shapeEntries(entry.props)
          .filter((prop) => kindOf(prop.schema)?.kind === kind)
          .map((prop) => `${entry.name}.${prop.name}`),
      );

    expect(marked("bindable").sort()).toEqual([
      "AreaChart.data",
      "BarChart.data",
      "Checkbox.checked",
      "CheckboxGroup.value",
      "ColumnChart.data",
      "DatePicker.value",
      "LineChart.data",
      "List.items",
      "NumberField.value",
      "PieChart.data",
      "RadioGroup.value",
      "Select.value",
      "Slider.value",
      "Switch.checked",
      "Table.rows",
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

describe("prop schemas", () => {
  it("recognize genui schemas by identity and leave library schemas alone", () => {
    expect(kindOf(bindable(type("string")))?.kind).toBe("bindable");
    expect(kindOf(computed(type("number")))?.kind).toBe("computed");
    expect(kindOf(url("link", "x"))?.kind).toBe("url");
    expect(kindOf(nodes("x"))?.kind).toBe("nodes");
    expect(kindOf(list(type("string")))?.kind).toBe("list");
    expect(kindOf(type("string"))).toBeUndefined();
    expect(isShape({ a: type("string") })).toBe(true);
    expect(isShape(type("string"))).toBe(false);
  });

  it("read optional keys and descriptions", () => {
    expect(
      shapeEntries({ a: type("string"), "b?": type("number").describe("B") }).map((entry) => [
        entry.name,
        entry.optional,
        descriptionOf(entry.schema),
      ]),
    ).toEqual([
      ["a", false, undefined],
      ["b", true, "B"],
    ]);
    expect(descriptionOf(bindable(type("string").describe("Inner")))).toBe("Inner");
    expect(descriptionOf(bindable(type("string").describe("Inner"), "Outer"))).toBe("Outer");
  });

  it("describe the shapes for a model", () => {
    expect(describeType(bindable(type("number")))).toBe("number | Binding");
    expect(describeType(computed(type("string")))).toBe("string | Expression");
    expect(describeType(nodes("x"))).toBe("Component[]");
    expect(describeType(oneOf(["xs", "sm", "md"]))).toBe('"xs" | "sm" | "md"');
    expect(describeType({ a: type("string"), "b?": type("number") })).toBe(
      "{ a: string, b?: number }",
    );
    expect(describeType(list({ title: type("string"), "href?": url("link", "x") }))).toBe(
      "{ title: string, href?: URL }[]",
    );
    expect(describeType(type("(string | number)[]"))).toBe("(number | string)[]");
    expect(describeType(type("string | null"))).toBe("string | null");
  });
});
