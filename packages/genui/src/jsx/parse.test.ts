import { describe, expect, it } from "vitest";
import { maxJsxDepth, maxJsxLength, maxJsxNodes, parsePartialJsx, type JsxNode } from "./parse.js";

function flatten(nodes: JsxNode[]): JsxNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === "element") return [node, ...flatten(node.children)];
    return [node];
  });
}

describe("parsePartialJsx", () => {
  it("reads elements, literal props, expressions, and multiple roots", () => {
    const result = parsePartialJsx(
      `<Stack gap={2} enabled hidden={false} empty={null}>
      <Heading level={1}>Plan &amp; book</Heading>
      <Chart data={[{"name":"A","value":3}]} options={{"colors":["red"]}} />
      <Output label='Total' value={round(seats * 12, 2)} />
      {'Seats: ' + seats}
    </Stack><Text text="Done"/>`,
      { final: true },
    );
    expect(result.errors).toEqual([]);
    expect(result.complete).toBe(true);
    expect(result.nodes).toHaveLength(2);
    const root = result.nodes[0];
    expect(root).toMatchObject({
      kind: "element",
      key: "/0",
      name: "Stack",
      props: { gap: 2, enabled: true, hidden: false, empty: null },
      closed: true,
    });
    if (root?.kind !== "element") throw new Error("Expected Stack");
    expect(root.children).toMatchObject([
      {
        key: "/0/children/0",
        name: "Heading",
        children: [{ key: "/0/children/0/children/0", text: "Plan & book", closed: true }],
      },
      {
        key: "/0/children/1",
        name: "Chart",
        props: { data: [{ name: "A", value: 3 }], options: { colors: ["red"] } },
      },
      {
        key: "/0/children/2",
        name: "Output",
        props: { label: "Total", value: { $expr: "round(seats * 12, 2)" } },
      },
      { kind: "expression", key: "/0/children/3", source: "'Seats: ' + seats", closed: true },
    ]);
    expect(result.nodes[1]?.key).toBe("/1");
  });

  it("withholds the entire element until its opening tag and attributes finish", () => {
    const source = `<Button disabled label='Say "hello" {now}' value={{"quote":"}","nested":[1]}} />`;
    for (let end = 0; end < source.length; end += 1) {
      expect(parsePartialJsx(source.slice(0, end)), `cut ${end}`).toEqual({
        nodes: [],
        errors: [],
        complete: false,
      });
    }
    expect(parsePartialJsx(source).nodes[0]).toMatchObject({
      props: { disabled: true, label: 'Say "hello" {now}', value: { quote: "}", nested: [1] } },
      closed: true,
    });
  });

  it("preserves growing text and marks finished siblings closed", () => {
    expect(parsePartialJsx("<Text>Hello")).toMatchObject({
      complete: false,
      nodes: [
        { closed: false, children: [{ text: "Hello", key: "/0/children/0", closed: false }] },
      ],
    });
    expect(parsePartialJsx("<Text>Hello<Output label='A' value={seats}/>")).toMatchObject({
      nodes: [
        {
          closed: false,
          children: [
            { text: "Hello", closed: true },
            { name: "Output", closed: true },
          ],
        },
      ],
    });
    expect(parsePartialJsx("Hello", { final: true })).toMatchObject({
      complete: true,
      nodes: [{ text: "Hello", closed: true }],
    });
    expect(parsePartialJsx("Hello").complete).toBe(false);
  });

  it("preserves spaces between expressions without emitting unfinished indentation", () => {
    const source = "<Button>{first} {last}</Button>";
    const root = parsePartialJsx(source).nodes[0];
    if (root?.kind !== "element") throw new Error("Expected Button");
    expect(root.children).toMatchObject([
      { kind: "expression", key: "/0/children/0", source: "first" },
      { kind: "text", key: "/0/children/1", text: " ", closed: true },
      { kind: "expression", key: "/0/children/2", source: "last" },
    ]);
    let previous: JsxNode[] = [];
    for (let end = 0; end <= source.length; end += 1) {
      const current = flatten(parsePartialJsx(source.slice(0, end)).nodes);
      for (const node of previous) {
        const next = current.find((entry) => entry.key === node.key);
        expect(next?.kind, `cut ${end}`).toBe(node.kind);
        if (node.closed) expect(next, `cut ${end}`).toEqual(node);
      }
      previous = current;
    }
    expect(parsePartialJsx("<Button>{first} ").nodes[0]).toMatchObject({
      children: [{ kind: "expression" }],
    });
    expect(
      parsePartialJsx("<Stack>\n <Text>A</Text>\n <Text>B</Text>\n</Stack>").nodes[0],
    ).toMatchObject({ children: [{ name: "Text" }, { name: "Text" }] });
  });

  it("withholds unfinished child expressions and validates them before emission", () => {
    for (const source of ["<Text>{", "<Text>{seats +", `<Text>{'quoted }`, `<Text>{round(1,`]) {
      expect(parsePartialJsx(source)).toMatchObject({
        errors: [],
        nodes: [{ children: [] }],
        complete: false,
      });
    }
    expect(parsePartialJsx(`<Text>{'quoted } brace' + seats}</Text>`)).toMatchObject({
      complete: true,
      nodes: [{ children: [{ kind: "expression", source: "'quoted } brace' + seats" }] }],
    });
  });

  it("decodes entities as text, withholds unfinished ones, and repairs invalid Unicode", () => {
    const source =
      "<Text>A &amp; B &lt;script&gt; &#x1F600; &#169; &quot;x&quot; &apos;y&apos; &#0; &#xD800; &unknown;</Text>";
    expect(
      flatten(parsePartialJsx(source).nodes).find((node) => node.kind === "text"),
    ).toMatchObject({ text: "A & B <script> 😀 © \"x\" 'y' � � &unknown;" });
    for (const suffix of ["&", "&a", "&amp", "&#", "&#x", "&#x1F60", "\ud83d"]) {
      const result = flatten(parsePartialJsx(`<Text>A ${suffix}`).nodes);
      expect(result[1]).toMatchObject({ text: "A ", closed: false });
    }
    expect(
      parsePartialJsx('<Text label="&lt;img src=x&gt; &amp; &#x1F600;"/>').nodes[0],
    ).toMatchObject({ props: { label: "<img src=x> & 😀" } });
    expect(flatten(parsePartialJsx("<Text>\ud83dx</Text>").nodes)[1]).toMatchObject({ text: "�x" });
  });

  it("keeps keys and closed nodes unchanged at every byte boundary", () => {
    const source = `<Stack label="A &amp; B" data={[{"nested":{"quote":"} < >"}}]}>
  <Text>Hello &amp; 😀 world {'Price: ' + round(seats * 1.5, 2)}</Text>
  <Button disabled title='A {brace}'>Buy &lt;now&gt;</Button>
</Stack><Output label="Total" value={max(seats, 2)} />`;
    let previous: JsxNode[] = [];
    for (let end = 0; end <= source.length; end += 1) {
      const result = parsePartialJsx(source.slice(0, end));
      expect(result.errors, `cut ${end}`).toEqual([]);
      const current = flatten(result.nodes);
      for (const node of previous) {
        const next = current.find((entry) => entry.key === node.key);
        expect(next, `key ${node.key} at cut ${end}`).toBeDefined();
        expect(next?.kind).toBe(node.kind);
        if (node.closed) expect(next).toEqual(node);
        if (node.kind === "text" && next?.kind === "text")
          expect(next.text.startsWith(node.text)).toBe(true);
      }
      previous = current;
    }
    expect(parsePartialJsx(source)).toMatchObject({ errors: [], complete: true });
  });

  it.each([
    "user.name",
    "user['name']",
    "globalThis.alert(1)",
    "alert(1)",
    "import('module')",
    "(() => 1)()",
    "new Date()",
    "a = 1",
    "a; alert(1)",
    "...props",
    "`template`",
    "function() {}",
    "<script />",
    "a /* comment */ + 1",
    "constructor.constructor('return 1')()",
  ])("rejects executable or unlisted expression syntax: %s", (expression) => {
    for (const source of [
      `<Output label="X" value={${expression}}/>`,
      `<Text>{${expression}}</Text>`,
    ]) {
      const partial = parsePartialJsx(source);
      expect(partial.errors).toEqual([]);
      expect(flatten(partial.nodes).some((node) => node.kind === "expression")).toBe(false);
      const final = parsePartialJsx(source, { final: true });
      expect(final.complete).toBe(false);
      expect(final.errors.length).toBeGreaterThan(0);
    }
  });

  it.each([
    "<X a='1' a='2'/>",
    "<X a a/>",
    "<X a=unquoted/>",
    "<X a={}/>",
    "<X {...props}/>",
    "<Namespace.X/>",
    "<X a={1}b={2}/>",
    "<X></Y>",
    "</X>",
    "<X / >",
    "<X a={[1,]}/>",
    '<X a={{"x":1,}}/>',
    "<!-- comment -->",
    "<!DOCTYPE html>",
    "<?instruction?>",
    "<><X/></>",
  ])("rejects malformed markup: %s", (source) => {
    expect(parsePartialJsx(source).errors).toEqual([]);
    const final = parsePartialJsx(source, { final: true });
    expect(final.complete).toBe(false);
    expect(final.errors[0]?.code).toBeDefined();
  });

  it.each(["<", "<X", "<X a=", "<X a='", "<X a={", "<X/", "<X>", "<X></", "<X></X", "<X>{count"])(
    "reports final truncation: %s",
    (source) => {
      const result = parsePartialJsx(source, { final: true });
      expect(result.errors[0]?.code).toBe("truncated");
      expect(result.complete).toBe(false);
    },
  );

  it("retains safe earlier content after malformed later content", () => {
    const result = parsePartialJsx("<Text>Safe</Text><Button onClick={() => alert(1)}/>", {
      final: true,
    });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({ name: "Text", closed: true });
    expect(result.errors).toHaveLength(1);
  });

  it("keeps prototype-shaped names as own data properties", () => {
    const result = parsePartialJsx('<X __proto__={{"polluted":true}} constructor="data"/>');
    const node = result.nodes[0];
    if (node?.kind !== "element") throw new Error("Expected element");
    expect(Object.hasOwn(node.props, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(node.props)).toBe(Object.prototype);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("bounds element depth, node count, braced nesting, and source length", () => {
    const nested = "<X>".repeat(maxJsxDepth) + "</X>".repeat(maxJsxDepth);
    expect(parsePartialJsx(nested, { final: true }).complete).toBe(true);
    for (const source of [
      "<X>".repeat(maxJsxDepth + 1),
      "<X/>".repeat(maxJsxNodes + 1),
      `<X data={${"[".repeat(200)}${"]".repeat(200)}}/>`,
      "x".repeat(maxJsxLength + 1),
    ]) {
      expect(parsePartialJsx(source).errors).toEqual([]);
      const final = parsePartialJsx(source, { final: true });
      expect(final.complete).toBe(false);
      expect(final.errors.some((error) => error.code === "limit")).toBe(true);
      expect(flatten(final.nodes).length).toBeLessThanOrEqual(maxJsxNodes);
    }
    expect(parsePartialJsx("<X/>".repeat(maxJsxNodes)).complete).toBe(true);
  });

  it("never throws on arbitrary prefixes", () => {
    const alphabet = [
      "<",
      ">",
      "{",
      "}",
      "[",
      "]",
      "(",
      ")",
      "'",
      '"',
      "=",
      "/",
      "&",
      ";",
      "\\",
      "X",
      "a",
      "1",
      "-",
      " ",
      "\u0000",
      "😀",
    ];
    let seed = 42;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (let index = 0; index < 2000; index += 1) {
      let source = "";
      for (let length = next() % 60; length > 0; length -= 1)
        source += alphabet[next() % alphabet.length]!;
      expect(() => parsePartialJsx(source)).not.toThrow();
      expect(() => parsePartialJsx(source, { final: true })).not.toThrow();
    }
  });
});
