import { type } from "arktype";
import { type ComponentProps } from "react";
import { describe, expect, expectTypeOf, it } from "vitest";
import { spec, vocabulary, type ComponentSpec } from "./spec.js";
import { state } from "./state.js";

const Text = spec("Text", { description: "A paragraph.", props: {}, children: "text" });
const Field = spec("Field", {
  description: "A named editable field.",
  props: { label: type("string"), "value?": type("string") },
  binding: { prop: "value", kind: "string" },
});
const Stack = spec("Stack", {
  description: "A vertical stack.",
  props: { "gap?": type("number") },
  children: "nodes",
});

describe("composition specs", () => {
  it("keeps custom implementation props strongly inferred in heterogeneous vocabularies", () => {
    const field = Field.implement((props) => {
      expectTypeOf(props.label).toEqualTypeOf<string>();
      expectTypeOf(props.value).toEqualTypeOf<string | null | undefined>();
      return null;
    });
    expectTypeOf<ComponentProps<typeof field.component>["label"]>().toEqualTypeOf<string>();
    expectTypeOf(Field).toExtend<ComponentSpec>();
    const text = Text.implement(() => null);
    expect(vocabulary(field, text, Stack).specs).toEqual([field, text, Stack]);
    expect(field).toMatchObject({ name: "Field", component: expect.any(Function) });
    expect(Field).not.toHaveProperty("component");
  });

  it("combines groups and selects a vocabulary while preserving its contracts", () => {
    const controls = vocabulary(Field);
    const all = vocabulary([Text, Stack], controls);
    expect(all.only("Stack", "Field").specs).toEqual([Stack, Field]);
    expect(all.only("Field").specs[0]).toBe(Field);
    expect(all.only().specs).toEqual([]);
    expect(() => all.only("Missing")).toThrow("Unknown component");
    expect(() => all.only("Text", "Text")).toThrow("Duplicate component");
    expect(() => vocabulary(Text, vocabulary(Text))).toThrow("Duplicate component");
    expect(all.validate("<Text>Hello</Text>").errors).toEqual([]);
    expect(all.only("Field").validate("<Text>Hello</Text>").errors).toMatchObject([
      { code: "unknown-type" },
    ]);
  });

  it("rejects ambiguous programmer contracts", () => {
    for (const name of ["Update", "Append"]) {
      expect(() => spec(name, { description: "Reserved.", props: {} })).toThrow("reserved");
    }
    expect(() =>
      spec("Reserved", { description: "Reserved.", props: { id: type("string") } }),
    ).toThrow("composition props");
    for (const name of ["", "div", "Tabs.Panel", "A-B"]) {
      expect(() => spec(name, { description: "Invalid.", props: {} })).toThrow(
        "Invalid component name",
      );
    }
    expect(() =>
      spec("Bad", {
        description: "Invalid.",
        props: { label: type("string"), "label?": type("string") },
      }),
    ).toThrow("duplicate props");
    expect(() =>
      spec("Bad", { description: "Invalid.", props: { children: type("string") } }),
    ).toThrow("composition props");
    expect(() =>
      spec("Bad", {
        description: "Invalid.",
        props: {},
        binding: { prop: "value", kind: "string" },
      }),
    ).toThrow("unknown binding prop");
  });

  it("prompts only the selected JSX components, child contracts, and declared state", () => {
    const Section = spec("Section", {
      description: "A section.",
      props: {},
      children: ["Text", "Field"],
    });
    const selected = vocabulary(Text, Field, Stack, Section).only("Text", "Field", "Section");
    const prompt = selected.prompt({ state: state({ query: type("string") }, { query: "hello" }) });
    expect(prompt).toContain("restricted JSX");
    expect(prompt).toContain('<Update id="name"');
    expect(prompt).toContain('<Append to="name"');
    expect(prompt).toContain("Previous views and their shared root stay mounted");
    expect(prompt).toContain("Allowed components: Text, Field, Section.");
    expect(prompt).not.toContain("<Stack>");
    expect(prompt).toContain('bind="name"');
    expect(prompt).toContain('query: {"type":"string"}; initial "hello"');
    expect(prompt).toContain("Children: only Text, Field; no text.");
    expect(prompt).toContain("Children: text and scalar expressions only.");
    expect(prompt).toContain("Children: none; use a self-closing tag.");
    expect(prompt).toContain('"required":["label"]');
    expect(prompt).toContain("Binding: bind supplies value (string).");
    for (const forbidden of [
      "event handlers",
      "spread attributes",
      "member access",
      "unlisted functions",
    ])
      expect(prompt).toContain(forbidden);
    expect(vocabulary(Stack).prompt()).toContain("Children: any allowed components and text.");
    expect(vocabulary(Text).prompt()).toContain("No state is declared");
  });
});
