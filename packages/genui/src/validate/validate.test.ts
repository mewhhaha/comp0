import { describe, expect, it } from "vitest";
import { z } from "zod";
import { answers, asJson, hostile } from "../../test/answers/index.js";
import { kitchenSink } from "../../test/fixtures.js";
import { catalog } from "../catalog/catalog.js";
import { defineEntry } from "../catalog/types.js";
import { genuiPromptExamples } from "../prompt/prompt.js";
import { formatErrors } from "./errors.js";
import { maxNodeDepth, maxNodes, validateNode, validateResponse } from "./validate.js";
import { Binding, Computed, ValidNode } from "./values.js";

function validate(value: unknown, options: Parameters<typeof validateResponse>[1] = {}) {
  return validateResponse(value, options);
}

function propsOf(value: unknown) {
  return validate(value).root?.props;
}

describe("validateResponse", () => {
  it("accepts every realistic answer, the kitchen sink, and the prompt examples without errors", () => {
    for (const value of [
      ...answers.map((answer) => answer.value),
      kitchenSink,
      ...genuiPromptExamples,
    ]) {
      const result = validate(value);
      expect(result.errors).toEqual([]);
      expect(result.root).toBeInstanceOf(ValidNode);
    }
  });

  it("accepts the text of a response and an already parsed one alike", () => {
    const fromText = validate(asJson(kitchenSink));
    const fromValue = validate(kitchenSink);

    expect(fromText.errors).toEqual([]);
    expect(fromText.bindings).toEqual(fromValue.bindings);
  });

  it("keys every node by its JSON Pointer", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Text", text: "a" },
        { type: "Card", title: "T", children: [{ type: "Text", text: "b" }] },
      ],
    });
    const keys: string[] = [];
    const visit = (node: ValidNode) => {
      keys.push(node.key);
      for (const value of Object.values(node.props)) {
        if (Array.isArray(value)) value.filter((item) => item instanceof ValidNode).forEach(visit);
      }
    };
    visit(result.root!);

    expect(keys).toEqual(["", "/children/0", "/children/1", "/children/1/children/0"]);
  });

  it("keeps only the props the schema declares", () => {
    const result = validate({ type: "Text", text: "hi", onClick: "x", style: "y", className: "z" });

    expect(result.root?.props).toEqual({ text: "hi" });
    expect(result.errors.map((error) => error.code)).toEqual([
      "unknown-prop",
      "unknown-prop",
      "unknown-prop",
    ]);
    expect(result.errors[0]).toMatchObject({ path: "/onClick", component: "Text" });
  });

  it("drops a prop of the wrong type and says what was expected", () => {
    const result = validate({
      type: "Slider",
      label: "Seats",
      name: "seats",
      min: "low",
      step: [1],
    });

    expect(result.root?.props).toEqual({ label: "Seats", name: "seats" });
    expect(result.errors).toEqual([
      {
        path: "/min",
        code: "invalid-prop",
        message: "expected number, got a string",
        component: "Slider",
      },
      {
        path: "/step",
        code: "invalid-prop",
        message: "expected number, got an array",
        component: "Slider",
      },
    ]);
  });

  it("names the allowed values of an enum", () => {
    const result = validate({ type: "Stack", gap: "huge", children: [] });

    expect(result.root?.props).toEqual({ children: [] });
    expect(result.errors[0]?.message).toBe(
      'expected "xs" | "sm" | "md" | "lg" | "xl", got a string',
    );
  });

  it("reports a missing required prop and withholds the component", () => {
    const result = validate({ type: "Select", name: "plan", options: ["a"] });

    expect(result.root).toBeUndefined();
    expect(result.errors).toEqual([
      {
        path: "/label",
        code: "missing-prop",
        message: "required property label is missing",
        component: "Select",
      },
    ]);
  });

  it("treats null as a missing optional prop and reports a null required one", () => {
    const result = validate({
      type: "Slider",
      label: "S",
      name: "s",
      min: null,
      max: null,
      value: null,
    });

    expect(result.errors).toEqual([]);
    expect(result.root?.props).toEqual({ label: "S", name: "s" });
    const unnamed = validate({ type: "Slider", label: null, name: "s" });
    expect(unnamed.errors[0]?.code).toBe("invalid-prop");
    expect(unnamed.root).toBeUndefined();
  });

  it("reports unknown components with a suggestion, and skips them", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Textt", text: "x" },
        { type: "Carousel" },
        { type: "Text", text: "kept" },
      ],
    });
    const children = result.root?.props.children as ValidNode[];

    expect(children.map((node) => node.entry.name)).toEqual(["Text"]);
    expect(result.errors[0]).toMatchObject({ path: "/children/0/type", code: "unknown-type" });
    expect(result.errors[0]?.message).toContain("did you mean Text?");
    expect(result.errors[1]?.message).toContain("use one of: Stack");
  });

  it("does not resolve component names through prototypes", () => {
    for (const type of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      const result = validate({ type: "Stack", children: [{ type }] });
      expect(result.root?.props.children).toEqual([]);
      expect(result.errors[0]?.code).toBe("unknown-type");
    }
  });

  it("reports things that are not components", () => {
    const result = validate({ type: "Stack", children: ["text", 3, null, [1], {}, { type: 7 }] });

    expect(result.root?.props.children).toEqual([]);
    expect(result.errors.map((error) => error.code)).toEqual([
      "not-a-component",
      "not-a-component",
      "not-a-component",
      "not-a-component",
      "missing-type",
      "missing-type",
    ]);
    expect(validate('"text"').errors[0]?.code).toBe("not-a-component");
    expect(validate([]).errors[0]?.code).toBe("not-a-component");
  });

  it("drops unsafe URLs and says why", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Link", label: "x", href: "javascript:alert(1)" },
        { type: "Image", src: "data:image/png;base64,AAAA", alt: "a" },
        { type: "Link", label: "ok", href: "https://example.com" },
        { type: "Image", src: "/ok.png", alt: "a" },
      ],
    });
    const children = result.root?.props.children as ValidNode[];

    expect(children[0]!.props).toEqual({ label: "x" });
    expect(children[1]!.props).toEqual({ alt: "a" });
    expect(children[2]!.props.href).toBe("https://example.com");
    expect(children[3]!.props.src).toBe("/ok.png");
    expect(result.errors.map((error) => [error.path, error.code])).toEqual([
      ["/children/0/href", "unsafe-url"],
      ["/children/1/src", "unsafe-url"],
    ]);
  });

  it("validates the parts inside a prop and drops the ones that do not fit", () => {
    const props = propsOf({
      type: "Select",
      label: "L",
      name: "n",
      options: [
        "a",
        { value: "b", label: "B" },
        { label: "no value" },
        5,
        { value: "c", extra: 1 },
      ],
    });

    expect(props?.options).toEqual(["a", { value: "b", label: "B" }, { value: "c" }]);
    const errors = validate({
      type: "Select",
      label: "L",
      name: "n",
      options: [{ label: "no value" }, { value: "c", extra: 1 }],
    }).errors;
    expect(errors.map((error) => error.path)).toEqual(["/options/0/value", "/options/1/extra"]);
  });

  it("validates nodes nested inside parts", () => {
    const result = validate({
      type: "Tabs",
      tabs: [
        { label: "One", children: [{ type: "Text", text: "a" }, { type: "Nope" }] },
        { label: "Two" },
      ],
    });
    const tabs = result.root?.props.tabs as { label: string; children?: ValidNode[] }[];

    expect(tabs).toHaveLength(1);
    expect(tabs[0]!.children).toHaveLength(1);
    expect(tabs[0]!.children![0]!.key).toBe("/tabs/0/children/0");
    expect(result.errors.map((error) => [error.path, error.code])).toEqual([
      ["/tabs/0/children/1/type", "unknown-type"],
      ["/tabs/1/children", "missing-prop"],
    ]);
  });

  it("turns bindings and expressions into Binding and Computed", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Slider", label: "Seats", name: "seats", value: { $bind: "seats", initial: 3 } },
        { type: "Output", label: "Cost", value: { $expr: "seats * 12" } },
        { type: "Text", text: { $expr: "'Seats: ' + seats" } },
      ],
    });
    const [slider, output, text] = result.root!.props.children as ValidNode[];

    expect(result.errors).toEqual([]);
    expect(slider!.props.value).toBeInstanceOf(Binding);
    expect(slider!.props.value).toMatchObject({ name: "seats", initial: 3 });
    expect(output!.props.value).toBeInstanceOf(Computed);
    expect((output!.props.value as Computed).source).toBe("seats * 12");
    expect(text!.props.text).toBeInstanceOf(Computed);
    expect(result.bindings).toEqual(new Map([["seats", 3]]));
  });

  it("uses the first initial written for a name", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "TextField", label: "A", name: "a", value: { $bind: "x" } },
        { type: "TextField", label: "B", name: "b", value: { $bind: "x", initial: "first" } },
        { type: "TextField", label: "C", name: "c", value: { $bind: "x", initial: "second" } },
      ],
    });

    expect(result.bindings.get("x")).toBe("first");
  });

  it("rejects malformed bindings and expressions", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "TextField", label: "A", name: "a", value: { $bind: "not a name" } },
        { type: "TextField", label: "B", name: "b", value: { $bind: 5 } },
        { type: "TextField", label: "C", name: "c", value: { $bind: "ok", initial: 5 } },
        { type: "TextField", label: "D", name: "d", value: { $bind: "ok2", extra: 1 } },
        { type: "Output", label: "E", value: { $expr: "1 +" } },
        { type: "Output", label: "F", value: { $expr: 5 } },
        { type: "Output", label: "G", value: { $expr: "alert(1)" } },
        { type: "Meter", label: "H", value: { $expr: "1", other: 1 } },
        { type: "Heading", text: { $expr: "1" } },
        { type: "Slider", label: "I", name: "i", value: { $expr: "1" } },
      ],
    });
    const codes = result.errors.map((error) => [error.path, error.code]);

    expect(codes).toContainEqual(["/children/0/value/$bind", "binding"]);
    expect(codes).toContainEqual(["/children/1/value/$bind", "binding"]);
    expect(codes).toContainEqual(["/children/2/value/initial", "invalid-prop"]);
    expect(codes).toContainEqual(["/children/3/value/extra", "unknown-prop"]);
    expect(codes).toContainEqual(["/children/4/value/$expr", "expression"]);
    expect(codes).toContainEqual(["/children/5/value/$expr", "expression"]);
    expect(codes).toContainEqual(["/children/6/value/$expr", "expression"]);
    expect(codes).toContainEqual(["/children/7/value/other", "unknown-prop"]);
    // Only the props that allow an expression accept one.
    expect(codes).toContainEqual(["/children/8/text", "invalid-prop"]);
    expect(codes).toContainEqual(["/children/9/value", "invalid-prop"]);
    const children = result.root?.props.children as ValidNode[];
    // A control keeps working without its binding; a result without a value is withheld.
    expect(children[0]!.props.value).toBeUndefined();
    expect(children.map((node) => node.entry.name)).toEqual([
      "TextField",
      "TextField",
      "TextField",
      "TextField",
      "Meter",
      "Slider",
    ]);
  });

  it("reports an expression that reads a name nothing binds", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Slider", label: "S", name: "s", value: { $bind: "seats" } },
        { type: "Output", label: "O", value: { $expr: "seats * price" } },
      ],
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ code: "unknown-binding", component: "Output" });
    expect(result.errors[0]?.message).toContain('"$bind": "price"');
    // Names that come from a saved state are known.
    expect(
      validate({ type: "Output", label: "O", value: { $expr: "price" } }, { known: ["price"] })
        .errors,
    ).toEqual([]);
  });

  it("finds a binding declared after the expression that reads it", () => {
    const result = validate({
      type: "Stack",
      children: [
        { type: "Output", label: "O", value: { $expr: "seats" } },
        { type: "Slider", label: "S", name: "s", value: { $bind: "seats" } },
      ],
    });

    expect(result.errors).toEqual([]);
  });

  it("limits array sizes, node counts, and nesting depth", () => {
    const rows = validate({
      type: "Table",
      caption: "C",
      columns: ["A"],
      rows: Array.from({ length: 600 }, (_, index) => [String(index)]),
    });
    expect((rows.root!.props.rows as unknown[]).length).toBe(500);
    expect(rows.errors.map((error) => error.code)).toEqual(["limit"]);

    const wide = validate({
      type: "Stack",
      children: Array.from({ length: 3 }, () => ({
        type: "Stack",
        children: Array.from({ length: 400 }, () => ({ type: "Separator" })),
      })),
    });
    expect(wide.errors.filter((error) => error.code === "limit")).toHaveLength(1);
    expect(wide.errors[0]?.message).toContain(`${maxNodes} components`);

    let nested: unknown = { type: "Text", text: "deep" };
    for (let level = 0; level < maxNodeDepth + 10; level += 1)
      nested = { type: "Stack", children: [nested] };
    const deep = validate(nested);
    expect(deep.errors.some((error) => error.code === "limit")).toBe(true);
    let depth = 0;
    for (let node = deep.root; node; node = (node.props.children as ValidNode[] | undefined)?.[0])
      depth += 1;
    expect(depth).toBeLessThanOrEqual(maxNodeDepth + 1);
  });

  it("caps the number of errors it returns", () => {
    const result = validate({
      type: "Stack",
      children: Array.from({ length: 200 }, () => ({ type: "Nope" })),
    });

    expect(result.errors.length).toBe(51);
    expect(result.errors.at(-1)).toMatchObject({ code: "limit", path: "" });
  });

  it("survives the hostile answer and reports problems in it", () => {
    const result = validate(hostile.source);

    expect(result.root).toBeInstanceOf(ValidNode);
    expect(result.errors.length).toBeGreaterThan(20);
    expect(formatErrors(result.errors)).toContain("Fix them and answer again");
  });

  it("works with a custom catalog", () => {
    const Shout = defineEntry({
      name: "Shout",
      group: "Layout",
      description: "Loud text. Requires text.",
      props: z.object({ text: z.string().describe("What to shout.") }),
      component: () => null,
    });
    const result = validate({ type: "Shout", text: "HEY" }, { catalog: [Shout] });

    expect(result.errors).toEqual([]);
    expect(validate({ type: "Text", text: "x" }, { catalog: [Shout] }).errors[0]?.code).toBe(
      "unknown-type",
    );
    expect(validate({ type: "Shout", text: "x" }).errors[0]?.code).toBe("unknown-type");
    expect(catalog.length).toBeGreaterThan(1);
  });
});

describe("validation while streaming", () => {
  it("reports nothing until the response is complete", () => {
    const broken = { type: "Stack", children: [{ type: "Nope" }, { type: "Select" }], extra: 1 };

    expect(validate(broken, { complete: false }).errors).toEqual([]);
    expect(validate(broken, { complete: true }).errors.length).toBeGreaterThan(0);
  });

  it("never reports an error for any prefix of a valid response while it streams", () => {
    for (const source of [...answers.map((answer) => answer.source), asJson(kitchenSink)]) {
      for (let end = 0; end < source.length; end += 7) {
        const result = validate(source.slice(0, end), { complete: false });
        expect(result.errors, `cut ${end}`).toEqual([]);
        expect(result.complete).toBe(false);
      }
    }
  });

  it("does not report a valid response's prefixes as invalid once the stream has ended early", () => {
    const source = asJson(answers[0]!.value);
    const result = validate(source.slice(0, 200), { complete: true });

    expect(result.errors.map((error) => error.code)).toEqual(["truncated"]);
    expect(result.errors[0]?.message).toContain("ended before the JSON was complete");
  });

  it("renders nodes whose type is complete and waits for a type still being written", () => {
    const waiting = validate('{"type": "Sta', { complete: false });
    expect(waiting.root).toBeUndefined();

    const text = validate('{"type": "Stack", "children": [{"type": "Tex', { complete: false });
    expect((text.root!.props.children as ValidNode[]).length).toBe(0);

    const ready = validate('{"type": "Stack", "children": [{"type": "Text", "text": "Hel', {
      complete: false,
    });
    const children = ready.root?.props.children as ValidNode[];
    expect(children[0]!.props).toEqual({ text: "Hel" });
    expect(children[0]!.key).toBe("/children/0");
  });

  it("withholds a URL until it is complete", () => {
    const partial = validate('{"type": "Image", "alt": "A", "src": "https://exam', {
      complete: false,
    });
    const whole = validate('{"type": "Image", "alt": "A", "src": "https://example.com/a.png"}', {
      complete: false,
    });

    expect(partial.root?.props).toEqual({ alt: "A" });
    expect(whole.root?.props.src).toBe("https://example.com/a.png");
  });

  it("withholds a binding name and an expression until their strings are complete", () => {
    const name = validate(
      '{"type": "TextField", "label": "A", "name": "a", "value": {"$bind": "se',
      {
        complete: false,
      },
    );
    const expr = validate('{"type": "Output", "label": "A", "value": {"$expr": "seats *', {
      complete: false,
    });
    const named = validate(
      '{"type": "TextField", "label": "A", "name": "a", "value": {"$bind": "seats"',
      { complete: false },
    );

    expect(name.root?.props.value).toBeUndefined();
    expect(expr.root?.props.value).toBeUndefined();
    expect(named.root?.props.value).toBeInstanceOf(Binding);
    expect(name.bindings.size).toBe(0);
  });

  it("reports syntax problems and an empty response only when complete", () => {
    expect(validate("{oops", { complete: false }).errors).toEqual([]);
    expect(validate("{oops", { complete: true }).errors[0]?.code).toBe("syntax");
    expect(validate("", { complete: true }).errors[0]?.code).toBe("syntax");
    expect(validate("", { complete: false }).errors).toEqual([]);
  });

  it("reads a finished stream whose last number touches the end", () => {
    const result = validate('{"type": "ProgressBar", "label": "L", "value": 40', {
      complete: true,
    });

    expect(result.errors.map((error) => error.code)).toEqual(["truncated"]);
    expect(result.root?.props).toEqual({ label: "L", value: 40 });
  });
});

describe("validateNode and formatErrors", () => {
  it("validates one finished object", () => {
    expect(validateNode({ type: "Text", text: "x" }).errors).toEqual([]);
    expect(validateNode({ type: "Text" }).errors[0]?.code).toBe("missing-prop");
  });

  it("formats errors as a message the model can act on", () => {
    expect(formatErrors([])).toBe("");
    const message = formatErrors(validate({ type: "Select", name: "n", options: [] }).errors);

    expect(message).toContain("1 problem. Fix it");
    expect(message).toContain("- /label [Select]: required property label is missing");
  });
});
