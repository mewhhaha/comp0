import { describe, expect, it } from "vitest";
import {
  evaluateExpression,
  expressionFunctions,
  maxExpressionLength,
  parseExpression,
} from "./expression.js";

const scope = { seats: 5, price: 12.5, name: "Ada", on: true, off: false, nothing: null };

function run(source: string, values: Record<string, unknown> = scope) {
  return evaluateExpression(source, values);
}

describe("evaluateExpression", () => {
  it("does arithmetic with the usual precedence", () => {
    expect(run("1 + 2 * 3")).toBe(7);
    expect(run("(1 + 2) * 3")).toBe(9);
    expect(run("10 - 4 - 3")).toBe(3);
    expect(run("2 * 3 % 4")).toBe(2);
    expect(run("-seats + 1")).toBe(-4);
    expect(run("--seats")).toBe(5);
    expect(run("+seats")).toBe(5);
    expect(run("seats * price")).toBe(62.5);
    expect(run("1.5e2 + .5")).toBe(150.5);
  });

  it("reads bound names, and unset ones as null", () => {
    expect(run("seats")).toBe(5);
    expect(run("name")).toBe("Ada");
    expect(run("unset")).toBeNull();
    expect(run("unset + 1")).toBeNull();
    expect(run("nothing * 2")).toBeNull();
  });

  it("compares and combines", () => {
    expect(run("seats > 3")).toBe(true);
    expect(run("seats <= 4")).toBe(false);
    expect(run("name == 'Ada'")).toBe(true);
    expect(run('name != "Ada"')).toBe(false);
    expect(run("name < 'B'")).toBe(true);
    expect(run("seats == 'a'")).toBe(false);
    expect(run("seats > 'a'")).toBeNull();
    expect(run("on && off")).toBe(false);
    expect(run("on || off")).toBe(true);
    expect(run("!off")).toBe(true);
    expect(run("!seats")).toBe(false);
    expect(run("unset || 7")).toBe(7);
    expect(run("seats && 7")).toBe(7);
  });

  it("chooses with a conditional", () => {
    expect(run("on ? 1 : 2")).toBe(1);
    expect(run("off ? 1 : on ? 2 : 3")).toBe(2);
    expect(run("seats > 3 ? seats * 2 : 0")).toBe(10);
    expect(run("unset ? 1 : 2")).toBe(2);
  });

  it("joins text with plus", () => {
    expect(run("'Hello ' + name")).toBe("Hello Ada");
    expect(run("name + seats")).toBe("Ada5");
    expect(run("name + on")).toBeNull();
    expect(run("'a\\'b'")).toBe("a'b");
  });

  it("calls the whitelisted functions", () => {
    expect(run("round(price)")).toBe(13);
    expect(run("round(1.23456, 2)")).toBe(1.23);
    expect(run("round(1.5, 99)")).toBe(1.5);
    expect(run("floor(2.9) + ceil(2.1)")).toBe(5);
    expect(run("abs(-3)")).toBe(3);
    expect(run("sign(-3)")).toBe(-1);
    expect(run("sqrt(16)")).toBe(4);
    expect(run("pow(2, 10)")).toBe(1024);
    expect(run("min(3, 1, 2)")).toBe(1);
    expect(run("max(3, 1, 2)")).toBe(3);
    expect(run("sum(1, 2, 3)")).toBe(6);
    expect(run("avg(2, 4)")).toBe(3);
    expect(run("clamp(15, 0, 10)")).toBe(10);
    expect(run("sum(seats, unset)")).toBeNull();
    expect(run("round('x')")).toBeNull();
    expect(expressionFunctions.map((item) => item.name)).toContain("round");
  });

  it("never produces NaN or Infinity", () => {
    expect(run("1 / 0")).toBeNull();
    expect(run("1 % 0")).toBeNull();
    expect(run("0 / 0")).toBeNull();
    expect(run("sqrt(-1)")).toBeNull();
    expect(run("pow(10, 400)")).toBeNull();
    expect(run("seats * 1e308 * 10")).toBeNull();
    expect(run("seats", { seats: Number.POSITIVE_INFINITY })).toBeNull();
    expect(run("seats", { seats: Number.NaN })).toBeNull();
  });

  it("reads only own, plain values from the scope", () => {
    expect(run("constructor")).toBeNull();
    expect(run("__proto__")).toBeNull();
    expect(run("toString")).toBeNull();
    expect(run("seats", { seats: { nested: 1 } })).toBeNull();
    expect(evaluateExpression("a + b", (name) => (name === "a" ? 1 : 2))).toBe(3);
  });

  it("returns null for a source that does not parse", () => {
    expect(run("1 +")).toBeNull();
  });
});

describe("parseExpression", () => {
  it("lists the names it reads", () => {
    const result = parseExpression("seats * price + seats + round(extra)");

    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.expression.names).toEqual(["seats", "price", "extra"]);
  });

  it.each([
    ["", /empty/],
    ["   ", /empty/],
    ["1 +", /ends too soon/],
    ["(1 + 2", /Expected "\)"/],
    ["1 2", /after the end/],
    ["seats.length", /Property access is not supported/],
    ["seats[0]", /Unexpected character "\["/],
    ["alert(1)", /Unknown function alert/],
    ["constructor('x')()", /Unknown function constructor/],
    ["round", /is a function/],
    ["round()", /takes 1 to 2 arguments/],
    ["pow(1)", /takes 2 arguments/],
    ["clamp(1, 2)", /takes 3 arguments/],
    ["x = 1", /Unexpected character "="/],
    ["a ? b", /Expected ":"/],
    ["'open", /Unterminated string/],
    ["1 $ 2", /Unexpected character/],
    ["`x`", /Unexpected character/],
    ["a; b", /Unexpected character/],
    ["{}", /Unexpected character/],
    ["a & b", /Unexpected character/],
    ["a | b", /Unexpected character/],
    ["x => x", /Unexpected/],
  ])("rejects %j", (source, message) => {
    const result = parseExpression(source);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(message);
  });

  it("bounds length, nesting, and size", () => {
    expect(parseExpression("1+".repeat(maxExpressionLength)).ok).toBe(false);
    expect(parseExpression("(".repeat(200) + "1" + ")".repeat(200)).ok).toBe(false);
    expect(parseExpression("-".repeat(200) + "1").ok).toBe(false);
    expect(parseExpression("1+".repeat(150) + "1").ok).toBe(false);
    expect(parseExpression("a ? ".repeat(100) + "1" + " : 2".repeat(100)).ok).toBe(false);
    expect(parseExpression("(".repeat(20) + "1" + ")".repeat(20)).ok).toBe(true);
  });

  it("does not execute anything: no eval, no Function, no prototype access", () => {
    const hostile = [
      "constructor.constructor('return process')()",
      "this",
      "globalThis",
      "process.env",
      "window",
      "(function(){})()",
      "import('x')",
      "new Date()",
      "typeof 1",
      "1 in x",
    ];
    for (const source of hostile) {
      const result = parseExpression(source);
      if (result.ok) expect(evaluateExpression(result.expression, {})).toBeNull();
    }
  });
});
