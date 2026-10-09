import { describe, expect, it } from "vitest";
import { answers } from "../../test/answers/index.js";
import { kitchenSink } from "../../test/fixtures.js";
import { asJson } from "../../test/answers/index.js";
import { maxJsonDepth, parsePartialJson } from "./parse.js";

describe("parsePartialJson", () => {
  it("parses a whole document like JSON.parse", () => {
    const text =
      '{"a": [1, 2.5, -3e2, "x\\ny", true, false, null], "b": {"c": "\\u00e9\\ud83d\\ude00"}}';
    const result = parsePartialJson(text);

    expect(result.value).toEqual(JSON.parse(text));
    expect(result.complete).toBe(true);
    expect(result.open.size).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it("returns nothing for empty or blank text", () => {
    for (const text of ["", "   \n", "﻿"]) {
      const result = parsePartialJson(text);
      expect(result.value).toBeUndefined();
      expect(result.complete).toBe(false);
      expect(result.issues).toEqual([]);
    }
  });

  it("closes open strings, arrays, and objects and reports them as open", () => {
    const result = parsePartialJson('{"type": "Stack", "children": [{"type": "Text", "text": "Hel');

    expect(result.value).toEqual({ type: "Stack", children: [{ type: "Text", text: "Hel" }] });
    expect(result.complete).toBe(false);
    expect([...result.open].sort()).toEqual(["", "/children", "/children/0", "/children/0/text"]);
  });

  it("marks only the frontier open: finished siblings are closed", () => {
    const result = parsePartialJson('{"a": {"b": 1}, "c": [1, 2], "d": "x');

    expect([...result.open].sort()).toEqual(["", "/d"]);
  });

  it("drops a key whose value has not started and an unfinished key", () => {
    expect(parsePartialJson('{"a": 1, "b":').value).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": 1, "b"').value).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": 1, "b').value).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": 1,').value).toEqual({ a: 1 });
    expect(parsePartialJson("[1, ").value).toEqual([1]);
  });

  it("keeps a number that touches the end as open, and drops unfinished number syntax", () => {
    const grow = parsePartialJson('{"n": 12');
    expect(grow.value).toEqual({ n: 12 });
    expect(grow.open.has("/n")).toBe(true);

    for (const text of ['{"n": -', '{"n": 1.', '{"n": 1e', '{"n": 1e+']) {
      const result = parsePartialJson(text);
      expect(result.issues).toEqual([]);
      expect(result.value).toEqual(text.includes("1") ? { n: 1 } : {});
    }
    expect(parsePartialJson('{"n": 12}').open.size).toBe(0);
  });

  it("treats a number ending a final document as complete", () => {
    expect(parsePartialJson("12").complete).toBe(false);
    expect(parsePartialJson("12", { final: true })).toMatchObject({ value: 12, complete: true });
    expect(parsePartialJson('{"n": 12', { final: true }).open.has("/n")).toBe(false);
  });

  it("completes literals only when they are whole", () => {
    expect(parsePartialJson('{"a": tru').value).toEqual({});
    expect(parsePartialJson('{"a": true').value).toEqual({ a: true });
    expect(parsePartialJson('{"a": nul').value).toEqual({});
    expect(parsePartialJson('{"a": fals').value).toEqual({});
    expect(parsePartialJson('{"a": null}').value).toEqual({ a: null });
  });

  it("drops half-written escapes and keeps the text before them", () => {
    expect(parsePartialJson('"ab\\').value).toBe("ab");
    expect(parsePartialJson('"ab\\u').value).toBe("ab");
    expect(parsePartialJson('"ab\\u00').value).toBe("ab");
    expect(parsePartialJson('"ab\\u00e9').value).toBe("abé");
    expect(parsePartialJson('"ab\\n').value).toBe("ab\n");
  });

  it("repairs lone surrogates and keeps pairs", () => {
    expect(parsePartialJson('"a\\ud83d').value).toBe("a");
    expect(parsePartialJson('"a\\ud83dx"').value).toBe("a�x");
    expect(parsePartialJson('"a\\ude00"').value).toBe("a�");
    expect(parsePartialJson('"\\ud83d\\ude00"').value).toBe("😀");
    expect(parsePartialJson('"x\ud83d').value).toBe("x");
    expect(parsePartialJson('"x\ud83d"').value).toBe("x�");
    const value = parsePartialJson(`"${"😀"}"`).value as string;
    expect(/[\ud800-\udfff]/.test(value.replace(/[\ud800-\udbff][\udc00-\udfff]/g, ""))).toBe(
      false,
    );
  });

  it("accepts raw control characters in strings, as models write them", () => {
    expect(parsePartialJson('"a\nb\tc"').value).toBe("a\nb\tc");
  });

  it("ignores a Markdown code fence around the document", () => {
    const fenced = '```json\n{"a": [1,\n';
    expect(parsePartialJson(fenced).value).toEqual({ a: [1] });
    expect(parsePartialJson('```json\n{"a": 1}\n```', { final: true })).toMatchObject({
      value: { a: 1 },
      complete: true,
      issues: [],
    });
    expect(parsePartialJson("```jso").value).toBeUndefined();
    expect(parsePartialJson("```json\n").value).toBeUndefined();
  });

  it("reports unrecoverable syntax and keeps what came before", () => {
    const result = parsePartialJson('{"a": [1, 2], "b": oops, "c": 3}');

    expect(result.value).toEqual({ a: [1, 2] });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ path: "/b" });
    expect(result.complete).toBe(false);

    for (const text of [
      "{a: 1}",
      "{'a': 1}",
      '{"a" 1}',
      '{"a": 1 "b": 2}',
      "[1 2]",
      "hello",
      '{"a": "\\q"}',
    ]) {
      const broken = parsePartialJson(text);
      expect(broken.issues.length, text).toBeGreaterThan(0);
      expect(broken.complete, text).toBe(false);
    }
  });

  it("reports content after the end of the document", () => {
    const result = parsePartialJson('{"a": 1} trailing');

    expect(result.value).toEqual({ a: 1 });
    expect(result.complete).toBe(false);
    expect(result.issues[0]?.message).toMatch(/after the end/);
    expect(parsePartialJson('{"a": 1}  \n').complete).toBe(true);
  });

  it("keeps the last of duplicate keys", () => {
    expect(parsePartialJson('{"a": 1, "a": 2}').value).toEqual({ a: 2 });
  });

  it("keeps __proto__ as a plain key and never pollutes prototypes", () => {
    const result = parsePartialJson('{"__proto__": {"polluted": true}, "constructor": 1}');
    const value = result.value as Record<string, unknown>;

    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(Object.hasOwn(value, "__proto__")).toBe(true);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    expect(value.constructor).toBe(1);
  });

  it("turns numbers beyond the double range into null with an issue", () => {
    const result = parsePartialJson('{"a": 1e999, "b": [-1e999, 2]}');

    expect(result.value).toEqual({ a: null, b: [null, 2] });
    expect(result.issues).toHaveLength(2);
  });

  it("stops at the nesting limit instead of overflowing the stack", () => {
    const deep = "[".repeat(maxJsonDepth + 50);
    const result = parsePartialJson(deep);

    expect(result.issues[0]?.message).toMatch(/deeper/);
    let depth = 0;
    for (let value = result.value; Array.isArray(value); value = value[0]) depth += 1;
    expect(depth).toBeLessThanOrEqual(maxJsonDepth);
    const huge = parsePartialJson("[".repeat(200_000) + "]".repeat(200_000));
    expect(huge.issues.length).toBeGreaterThan(0);
    const objects = parsePartialJson('{"a":'.repeat(50_000));
    expect(objects.issues.length).toBeGreaterThan(0);
  });

  it("accepts nesting up to the limit", () => {
    const text = "[".repeat(maxJsonDepth) + "]".repeat(maxJsonDepth);

    expect(parsePartialJson(text)).toMatchObject({ complete: true, issues: [] });
  });

  it("escapes pointer keys", () => {
    const result = parsePartialJson('{"a/b": {"c~d": "x');

    expect(result.open.has("/a~1b/c~0d")).toBe(true);
  });

  it("never throws on arbitrary text", () => {
    const pieces = [
      "{",
      "}",
      "[",
      "]",
      '"',
      ":",
      ",",
      "\\",
      "u",
      "1",
      "-",
      ".",
      "e",
      "t",
      "n",
      "\u0000",
      "😀",
      " ",
    ];
    let seed = 12345;
    const next = () => {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
      return seed;
    };
    for (let index = 0; index < 3000; index += 1) {
      let text = "";
      for (let length = next() % 40; length > 0; length -= 1)
        text += pieces[next() % pieces.length]!;
      expect(() => parsePartialJson(text)).not.toThrow();
      expect(() => parsePartialJson(text, { final: true })).not.toThrow();
    }
  });
});

describe("every prefix of a realistic document", () => {
  const documents = [...answers.map((answer) => answer.source), asJson(kitchenSink)];

  it.each(documents.map((source, index) => [index, source] as const))(
    "document %i parses at every cut, grows monotonically, and ends equal to JSON.parse",
    (_index, source) => {
      const full = JSON.parse(source) as unknown;
      let previous = 0;
      for (let end = 0; end <= source.length; end += 1) {
        const result = parsePartialJson(source.slice(0, end));
        expect(result.issues, `cut ${end}`).toEqual([]);
        // The text of the tree never shrinks as the document grows.
        const size = result.value === undefined ? 0 : JSON.stringify(result.value).length;
        expect(size, `cut ${end}`).toBeGreaterThanOrEqual(previous);
        previous = size;
        if (end === source.length) {
          expect(result.value).toEqual(full);
          expect(result.complete).toBe(true);
          expect(result.open.size).toBe(0);
        }
      }
    },
    120_000,
  );
});
