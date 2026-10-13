import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { maxJsxLength, maxJsxNodes } from "../jsx/parse.js";
import { builtInVocabulary } from "./builtins.js";
import { validateEdits } from "./edits.js";
import { spec, vocabulary } from "./spec.js";
import { state } from "./state.js";

const contract = state({ city: type("'Oslo' | 'Tokyo'") }, { city: "Oslo" });
const Forecast = spec("Forecast", {
  description: "Forecast.",
  props: { city: type("string"), "value?": type("number") },
});
const components = vocabulary(builtInVocabulary, Forecast);
const initial =
  '<Stack id="panel"><Forecast id="forecast" city="Oslo" /><Text id="caption">A forecast.</Text></Stack>';
const options = { history: [initial], vocabulary: components, state: contract };

describe("JSX edit protocol", () => {
  it("merges props while preserving target identity, siblings and children", () => {
    const result = validateEdits('<Update id="forecast" city="Tokyo" value={2}/>', options);
    expect(result.errors).toEqual([]);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      kind: "update",
      target: "forecast",
      expectedRevision: 0,
      raw: {
        key: "/0/children/0",
        name: "Forecast",
        props: { id: "forecast", city: "Tokyo", value: 2 },
      },
      validated: { id: "forecast", props: { city: "Tokyo", value: 2 } },
    });
    expect(result.nodes[0]).toMatchObject({
      id: "panel",
      children: [{ id: "forecast" }, { id: "caption", children: [{ text: "A forecast." }] }],
    });
    expect(options.history).toEqual([initial]);
  });

  it("appends child parts in context with stable keys and sequential target revisions", () => {
    const history = ['<List id="list"><Item id="first">First</Item></List>'];
    const source =
      '<Append to="list"><Item id="second">Second</Item></Append><Append to="second"> entry</Append><Append to="list"><Item id="third">Third</Item></Append>';
    const result = validateEdits(source, { ...options, history });
    expect(result.errors).toEqual([]);
    expect(
      result.operations.map((operation) => [operation.target, operation.expectedRevision]),
    ).toEqual([
      ["list", 0],
      ["second", 0],
      ["list", 1],
    ]);
    expect(result.nodes[0]).toMatchObject({
      children: [
        { key: "/0/children/0", id: "first" },
        {
          key: "/edit/1/0/0/children/0",
          id: "second",
          children: [{ text: "Second" }, { text: " entry" }],
        },
        { id: "third" },
      ],
    });
    const append = result.operations[0];
    if (!append || append.kind !== "append") throw new Error("Expected append");
    expect(append.kind).toBe("append");
    expect(append.children).toHaveLength(1);
    expect(append.rawChildren[0]).toMatchObject({
      props: { id: "second" },
      children: [{ text: "Second" }],
    });
    expect(append.raw.children[1]).toMatchObject({ children: [{ text: "Second" }] });
  });

  it("replays accepted tree and edit turns and retains raw transformed inputs", () => {
    const Port = spec("Port", {
      description: "Port.",
      props: {
        value: z.string().transform((value) => Number(value) + 1),
        "label?": type("string"),
      },
    });
    const result = validateEdits('<Update id="port" label="Changed"/>', {
      vocabulary: vocabulary(Port),
      history: [
        '<Port id="port" value="10"/>',
        '<Update id="port" value="20"/>',
        '<Port id="other" value="30"/>',
      ],
    });
    expect(result.errors).toEqual([]);
    expect(result.operations[0]).toMatchObject({
      expectedRevision: 1,
      raw: { props: { value: "20", label: "Changed" } },
      validated: { props: { value: 21, label: "Changed" } },
    });
    expect(result.rawNodes[1]).toMatchObject({ key: "/turn/2/0" });
    expect(result.nodes[1]).toMatchObject({ props: { value: 31 } });
  });

  it.each([
    '<Update id="missing" city="Tokyo"/>',
    '<Update id="forecast"/>',
    '<Update id="forecast" city="Tokyo">Child</Update>',
    '<Update id="forecast" city="Tokyo"/><Update id="forecast" city={3}/>',
    '<Update id="forecast" unknown="ignored"/>',
    '<Update id="forecast" bind="city"/>',
    '<Update id="forecast" name="different"/>',
    '<Append to="panel"/>',
    '<Append to="panel" unknown="x"><Text>Added</Text></Append>',
    '<Append to="forecast"><Text>Invalid children</Text></Append>',
    '<Append to="panel"><Text id="caption">Duplicate</Text></Append>',
    '<Append to="panel"><Option value="x">Wrong parent</Option></Append>',
    '<Update id="forecast" city="Tokyo"/><Text>Mixed turn</Text>',
    '<Update id="forecast" city="Tokyo"/><Append to="panel"><Text>Unfinished',
    "",
  ])("rejects an entire malformed or invalid turn atomically", (source) => {
    const result = validateEdits(source, options);
    expect(result.operations).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.rawNodes[0]).toMatchObject({
      children: [{ props: { city: "Oslo" } }, { props: { id: "caption" } }],
    });
  });

  it("validates collection identity, vocabulary, bindings and refinements after grafting", () => {
    const history = [
      '<Select id="select" label="City" bind="city"><Option id="oslo" value="Oslo">Oslo</Option></Select>',
    ];
    for (const source of [
      '<Update id="oslo" value="Tokyo"/>',
      '<Append to="select"><Option value="Oslo">Duplicate</Option></Append>',
      '<Append to="select"><Option value="London">Outside schema</Option></Append>',
      '<Append to="select"><Option value={city}>Dynamic identity</Option></Append>',
      '<Append to="select"><script>Unsafe</script></Append>',
    ]) {
      const result = validateEdits(source, { ...options, history });
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.operations).toEqual([]);
    }
    expect(
      validateEdits('<Append to="select"><Option value="Tokyo">Tokyo</Option></Append>', {
        ...options,
        history,
      }).errors,
    ).toEqual([]);
  });

  it("isolates holes, permits absent scopes, and rejects duplicate envelopes", () => {
    const history = [
      '<Left><Stack id="left"/></Left><Right><Stack id="right"/></Right>',
      '<Right><Append to="right"><Text>Other side</Text></Append></Right>',
    ];
    const scoped = { ...options, history, scope: "Left", max: 1 };
    const result = validateEdits(
      '<Left><Append to="left"><Text id="added">Hello</Text></Append></Left>',
      scoped,
    );
    expect(result.errors).toEqual([]);
    expect(result.nodes[0]).toMatchObject({ id: "left", children: [{ id: "added" }] });
    expect(
      validateEdits('<Right><Append to="right"><Text>Ignored</Text></Append></Right>', scoped),
    ).toMatchObject({ operations: [], errors: [] });
    expect(
      validateEdits('<Left><Append to="right"><Text>Escape</Text></Append></Left>', scoped).errors
        .length,
    ).toBeGreaterThan(0);
    expect(
      validateEdits(
        '<Left><Update id="left" gap="sm"/></Left><Left><Update id="left" gap="sm"/></Left>',
        scoped,
      ).errors.length,
    ).toBeGreaterThan(0);
  });

  it("bounds accumulated roots, nodes, depth, source length and turn count", () => {
    expect(
      validateEdits('<Update id="a" gap="sm"/>', {
        ...options,
        history: ['<Stack id="a"/>', '<Stack id="b"/>'],
        max: 1,
      }).errors[0]?.code,
    ).toBe("limit");
    const many =
      '<Stack id="many">' + "<Text>x</Text>".repeat(Math.floor(maxJsxNodes / 2) - 1) + "</Stack>";
    expect(
      validateEdits('<Append to="many"><Text>Overflow</Text></Append>', {
        ...options,
        history: [many],
      }).errors[0]?.code,
    ).toBe("limit");
    const deep =
      '<Stack id="deep">' + "<Stack>".repeat(38) + '<Stack id="leaf"/>' + "</Stack>".repeat(39);
    expect(
      validateEdits('<Append to="leaf"><Stack/></Append>', { ...options, history: [deep] })
        .errors[0]?.code,
    ).toBe("limit");
    expect(validateEdits("x".repeat(maxJsxLength), options).errors[0]?.code).toBe("limit");
    expect(
      validateEdits('<Update id="panel" gap="sm"/>', {
        ...options,
        history: Array.from({ length: 1000 }, () => initial),
      }).errors[0]?.code,
    ).toBe("limit");
  });

  it("uses Map-based IDs safely and rejects invalid accepted history", () => {
    const result = validateEdits(
      '<Update id="__proto__" city="Tokyo"/><Update id="constructor" city="Oslo"/>',
      {
        ...options,
        history: [
          '<Forecast id="__proto__" city="Oslo"/><Forecast id="constructor" city="Tokyo"/>',
        ],
      },
    );
    expect(result.errors).toEqual([]);
    expect(result.operations.map((operation) => operation.target)).toEqual([
      "__proto__",
      "constructor",
    ]);
    expect(
      validateEdits('<Update id="x" city="Tokyo"/>', {
        ...options,
        history: ['<Forecast id="x" city={false}/>'],
      }).errors.length,
    ).toBeGreaterThan(0);
  });
});
