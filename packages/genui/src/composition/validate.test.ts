import { describe, expect, it } from "vitest";
import { type } from "arktype";
import { builtInVocabulary, forms, layout } from "./builtins.js";
import { spec, vocabulary } from "./spec.js";
import { state } from "./state.js";
import { validateJsx } from "./validate.js";

const contract = state(
  { city: type("'Oslo' | 'Tokyo'"), guests: type("1 <= number.integer <= 9") },
  { city: "Oslo", guests: 2 },
);
const options = { vocabulary: builtInVocabulary, state: contract };

describe("JSX composition validation", () => {
  it("keeps named targets as protocol metadata rather than rendered props", () => {
    const result = validateJsx(
      '<Stack id="summary"><Text id="__proto__">Hello</Text></Stack>',
      options,
    );
    expect(result.errors).toEqual([]);
    expect(result.nodes[0]).toMatchObject({
      id: "summary",
      props: {},
      children: [{ id: "__proto__", props: {} }],
    });
  });

  it("rejects duplicate and malformed target IDs without reporting prefixes", () => {
    const duplicate = validateJsx(
      '<Stack id="summary"><Text id="summary">Hello</Text></Stack>',
      options,
    );
    expect(duplicate.errors[0]?.message).toContain("unique");
    for (const id of ['""', '"9bad"', '"bad.id"', `{city}`, `"${"a".repeat(65)}"`]) {
      const source = `<Text id=${id}>Hello</Text>`;
      expect(validateJsx(source, options).errors[0]?.code).toBe("invalid-prop");
      expect(validateJsx(source, { ...options, complete: false }).errors).toEqual([]);
    }
  });
  it("validates children-driven choices, typed bindings and computed props", () => {
    const result = validateJsx(
      '<Stack><Select label="City" bind="city"><Option value="Oslo">Oslo</Option><Option value="Tokyo">Tokyo</Option></Select><Output label="Cost" value={guests * 12} /></Stack>',
      options,
    );
    expect(result.errors).toEqual([]);
    expect(result.nodes[0]).toMatchObject({
      name: "Stack",
      children: [
        { name: "Select", binding: "city" },
        { name: "Output", props: { value: { $expr: "guests * 12" } } },
      ],
    });
  });

  it("never draws a control against unknown or incompatible state", () => {
    for (const source of [
      '<Slider label="City" bind="city" />',
      '<Slider label="Speed" bind="speed" />',
    ]) {
      const result = validateJsx(source, options);
      expect(result.nodes).toEqual([]);
      expect(result.errors[0]?.code).toBe("binding");
    }
  });

  it("rejects an option outside the host union and undeclared expressions", () => {
    const result = validateJsx(
      '<Select label="City" bind="city"><Option value="London">London</Option></Select><Output label="Unknown" value={missing * 2}/>',
      options,
    );
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({ children: [] });
    expect(result.errors.map((error) => error.code)).toEqual(["binding", "unknown-binding"]);
  });

  it("enforces the host's narrowed vocabulary and part ancestry", () => {
    const result = validateJsx('<Option value="x">X</Option><Select label="City" />', {
      vocabulary: vocabulary(layout, forms.only("Option")),
    });
    expect(result.nodes).toEqual([]);
    expect(result.errors.map((error) => error.code)).toEqual(["invalid-prop", "unknown-type"]);
  });

  it("drops unknown props and unsafe URLs without exposing arbitrary HTML", () => {
    const result = validateJsx(
      '<Link href="javascript:alert(1)">Bad</Link><Text onClick="run">Safe</Text><script>bad</script>',
      options,
    );
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({ name: "Text", props: {} });
    expect(result.errors.map((error) => error.code)).toEqual([
      "invalid-prop",
      "unknown-prop",
      "unknown-type",
    ]);
  });

  it("enforces custom schema refinements and required names after the opening tag settles", () => {
    const Port = spec("Port", {
      description: "A port.",
      props: { value: type("1 <= number.integer <= 65535") },
    });
    expect(validateJsx("<Port value={0} />", { vocabulary: vocabulary(Port) }).nodes).toEqual([]);
    expect(validateJsx('<TextField label="" />', options).nodes).toEqual([]);
    expect(validateJsx("<TextField", { ...options, complete: false })).toEqual({
      nodes: [],
      errors: [],
    });
  });

  it("keeps every prefix quiet and completed opening-tag props fixed", () => {
    const source = '<Card title="Trip" tone="accent"><Text>A &amp; B</Text></Card>';
    for (let end = 0; end < source.length; end++) {
      const result = validateJsx(source.slice(0, end), { ...options, complete: false });
      expect(result.errors).toEqual([]);
      if (result.nodes.length)
        expect(result.nodes[0]).toMatchObject({ props: { title: "Trip", tone: "accent" } });
    }
  });

  it("drops duplicate collection values before a component registry can throw", () => {
    const result = validateJsx(
      '<Select label="City"><Option value="x">First</Option><Option value="x">Duplicate</Option></Select>',
      options,
    );
    expect(result.nodes[0]).toMatchObject({ children: [{ props: { value: "x" } }] });
    expect(result.errors[0]?.message).toContain("unique");
    const dynamic = validateJsx(
      '<Select label="City"><Option value={city}>City</Option></Select>',
      options,
    );
    expect(dynamic.nodes[0]).toMatchObject({ children: [] });
    const recovered = validateJsx(
      '<Select label="City"><Option value="x"></Option><Option value="x">Accepted</Option></Select>',
      options,
    );
    expect(recovered.nodes[0]).toMatchObject({
      children: [{ props: { value: "x" }, children: [{ text: "Accepted" }] }],
    });
  });

  it("withholds expression-only controls without meaningful accessible text", () => {
    for (const expression of ["null", "false", '""']) {
      const result = validateJsx(`<Button>{${expression}}</Button>`, options);
      expect(result.nodes).toEqual([]);
      expect(result.errors[0]?.code).toBe("missing-prop");
    }
    expect(validateJsx("<Button>{city}</Button>", options).errors).toEqual([]);
  });

  it("contains a custom schema validator failure as a prop error", () => {
    const Broken = spec("Broken", {
      description: "A failing schema",
      props: {
        value: {
          "~standard": {
            version: 1,
            vendor: "test",
            validate() {
              throw new Error("invalid value");
            },
            jsonSchema: { input: () => ({ type: "number" }), output: () => ({ type: "number" }) },
          },
        },
      },
    });
    const result = validateJsx("<Broken value={1} />", { vocabulary: vocabulary(Broken) });
    expect(result.nodes).toEqual([]);
    expect(result.errors[0]?.code).toBe("invalid-prop");
  });
});
