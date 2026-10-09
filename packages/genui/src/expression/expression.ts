/**
 * A small, safe expression language for computed values: `{ "$expr": "seats * 12" }`.
 *
 * Numbers, string literals, `true`/`false`/`null`, bound names, `+ - * / %`, comparisons,
 * `== !=`, `&& || !`, `a ? b : c`, parentheses, and a fixed list of functions. There is no
 * property access, no assignment, and no way to call anything outside the list; the source is
 * parsed by a hand-written parser and evaluated by walking the tree, never with `eval`.
 */

/** What an expression produces. Anything that is not a finite number becomes `null`. */
export type ExpressionValue = string | number | boolean | null;

export type ExpressionNode =
  | { kind: "literal"; value: ExpressionValue }
  | { kind: "name"; name: string }
  | { kind: "unary"; operator: "-" | "!"; operand: ExpressionNode }
  | { kind: "binary"; operator: BinaryOperator; left: ExpressionNode; right: ExpressionNode }
  | { kind: "conditional"; test: ExpressionNode; then: ExpressionNode; otherwise: ExpressionNode }
  | { kind: "call"; name: string; args: ExpressionNode[] };

type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "<"
  | "<="
  | ">"
  | ">="
  | "=="
  | "!="
  | "&&"
  | "||";

/** A parsed expression. */
export type Expression = {
  readonly source: string;
  readonly ast: ExpressionNode;
  /** The distinct names the expression reads, in order of first use. */
  readonly names: readonly string[];
};

export type ExpressionParse =
  | { ok: true; expression: Expression }
  | { ok: false; message: string; position: number };

export const maxExpressionLength = 500;
const maxExpressionDepth = 32;
const maxExpressionNodes = 200;

type FunctionSpec = {
  /** Smallest and largest argument counts. */
  arity: readonly [number, number];
  /** What the function does, for the prompt. */
  summary: string;
  run: (args: number[]) => number;
};

const numberFunctions: Record<string, FunctionSpec> = {
  round: {
    arity: [1, 2],
    summary: "round(x, digits?) rounds to a number of decimals (0 to 10; 0 by default)",
    run: ([x, digits]) => {
      const places = Math.min(10, Math.max(0, Math.trunc(digits ?? 0)));
      const factor = 10 ** places;
      return Math.round((x as number) * factor) / factor;
    },
  },
  floor: { arity: [1, 1], summary: "floor(x) rounds down", run: ([x]) => Math.floor(x as number) },
  ceil: { arity: [1, 1], summary: "ceil(x) rounds up", run: ([x]) => Math.ceil(x as number) },
  abs: { arity: [1, 1], summary: "abs(x) drops the sign", run: ([x]) => Math.abs(x as number) },
  sign: { arity: [1, 1], summary: "sign(x) is -1, 0, or 1", run: ([x]) => Math.sign(x as number) },
  sqrt: {
    arity: [1, 1],
    summary: "sqrt(x) is the square root",
    run: ([x]) => Math.sqrt(x as number),
  },
  pow: {
    arity: [2, 2],
    summary: "pow(x, y) is x to the power y",
    run: ([x, y]) => (x as number) ** (y as number),
  },
  min: {
    arity: [1, 16],
    summary: "min(a, b, ...) is the smallest",
    run: (args) => Math.min(...args),
  },
  max: {
    arity: [1, 16],
    summary: "max(a, b, ...) is the largest",
    run: (args) => Math.max(...args),
  },
  sum: {
    arity: [1, 16],
    summary: "sum(a, b, ...) adds the numbers",
    run: (args) => args.reduce((total, item) => total + item, 0),
  },
  avg: {
    arity: [1, 16],
    summary: "avg(a, b, ...) is the mean",
    run: (args) => args.reduce((total, item) => total + item, 0) / args.length,
  },
  clamp: {
    arity: [3, 3],
    summary: "clamp(x, low, high) keeps x between low and high",
    run: ([x, low, high]) =>
      Math.min(Math.max(x as number, low as number), Math.max(low as number, high as number)),
  },
};

/** The functions an expression may call, with a one-line summary of each for the prompt. */
export const expressionFunctions: readonly { name: string; summary: string }[] = Object.entries(
  numberFunctions,
).map(([name, spec]) => ({ name, summary: spec.summary }));

type Token =
  | { type: "number"; value: number; position: number }
  | { type: "string"; value: string; position: number }
  | { type: "name"; value: string; position: number }
  | { type: "punctuation"; value: string; position: number }
  | { type: "end"; position: number };

class ExpressionError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

const punctuation = [
  "<=",
  ">=",
  "==",
  "!=",
  "&&",
  "||",
  "+",
  "-",
  "*",
  "/",
  "%",
  "<",
  ">",
  "!",
  "(",
  ")",
  ",",
  "?",
  ":",
];

const stringEscapes: Record<string, string> = { n: "\n", t: "\t" };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  while (position < source.length) {
    const character = source[position]!;
    if (character === " " || character === "\t" || character === "\n" || character === "\r") {
      position += 1;
      continue;
    }
    if ((character >= "0" && character <= "9") || character === ".") {
      const match = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(position));
      if (!match) {
        throw new ExpressionError(
          character === "." ? "Property access is not supported" : "Invalid number",
          position,
        );
      }
      tokens.push({ type: "number", value: Number(match[0]), position });
      position += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(position))!;
      tokens.push({ type: "name", value: match[0], position });
      position += match[0].length;
      continue;
    }
    if (character === '"' || character === "'") {
      let value = "";
      let cursor = position + 1;
      for (;;) {
        const next = source[cursor];
        if (next === undefined) throw new ExpressionError("Unterminated string", position);
        if (next === character) break;
        if (next === "\\") {
          const escaped = source[cursor + 1];
          if (escaped === undefined) throw new ExpressionError("Unterminated string", position);
          value += stringEscapes[escaped] ?? escaped;
          cursor += 2;
          continue;
        }
        value += next;
        cursor += 1;
      }
      tokens.push({ type: "string", value, position });
      position = cursor + 1;
      continue;
    }
    const symbol = punctuation.find((candidate) => source.startsWith(candidate, position));
    if (symbol === undefined) {
      throw new ExpressionError(`Unexpected character ${JSON.stringify(character)}`, position);
    }
    tokens.push({ type: "punctuation", value: symbol, position });
    position += symbol.length;
  }
  tokens.push({ type: "end", position: source.length });
  return tokens;
}

const binaryLevels: readonly (readonly BinaryOperator[])[] = [
  ["||"],
  ["&&"],
  ["==", "!="],
  ["<", "<=", ">", ">="],
  ["+", "-"],
  ["*", "/", "%"],
];

class ExpressionParser {
  index = 0;
  nodes = 0;
  readonly names: string[] = [];

  constructor(readonly tokens: Token[]) {}

  peek(): Token {
    return this.tokens[this.index]!;
  }

  take(): Token {
    const token = this.peek();
    if (token.type !== "end") this.index += 1;
    return token;
  }

  isPunctuation(value: string) {
    const token = this.peek();
    return token.type === "punctuation" && token.value === value;
  }

  expect(value: string) {
    if (!this.isPunctuation(value)) {
      throw new ExpressionError(`Expected "${value}"`, this.peek().position);
    }
    this.take();
  }

  count(position: number) {
    this.nodes += 1;
    if (this.nodes > maxExpressionNodes) {
      throw new ExpressionError("The expression is too long", position);
    }
  }

  parse(): ExpressionNode {
    const node = this.conditional(0);
    const token = this.peek();
    if (token.type !== "end") {
      throw new ExpressionError("Unexpected text after the end of the expression", token.position);
    }
    return node;
  }

  conditional(depth: number): ExpressionNode {
    const test = this.binary(0, depth);
    if (!this.isPunctuation("?")) return test;
    const position = this.take().position;
    this.count(position);
    const then = this.conditional(depth + 1);
    this.expect(":");
    const otherwise = this.conditional(depth + 1);
    return { kind: "conditional", test, then, otherwise };
  }

  binary(level: number, depth: number): ExpressionNode {
    if (depth > maxExpressionDepth) {
      throw new ExpressionError("The expression is nested too deeply", this.peek().position);
    }
    const operators = binaryLevels[level];
    if (operators === undefined) return this.unary(depth);
    let left = this.binary(level + 1, depth);
    for (;;) {
      const token = this.peek();
      if (token.type !== "punctuation" || !(operators as readonly string[]).includes(token.value)) {
        return left;
      }
      this.take();
      this.count(token.position);
      const right = this.binary(level + 1, depth);
      left = { kind: "binary", operator: token.value as BinaryOperator, left, right };
    }
  }

  unary(depth: number): ExpressionNode {
    if (depth > maxExpressionDepth) {
      throw new ExpressionError("The expression is nested too deeply", this.peek().position);
    }
    const token = this.peek();
    if (token.type === "punctuation" && (token.value === "-" || token.value === "!")) {
      this.take();
      this.count(token.position);
      return { kind: "unary", operator: token.value, operand: this.unary(depth + 1) };
    }
    if (token.type === "punctuation" && token.value === "+") {
      this.take();
      return this.unary(depth + 1);
    }
    return this.primary(depth);
  }

  primary(depth: number): ExpressionNode {
    const token = this.take();
    this.count(token.position);
    if (token.type === "number") return { kind: "literal", value: token.value };
    if (token.type === "string") return { kind: "literal", value: token.value };
    if (token.type === "name") {
      if (token.value === "true") return { kind: "literal", value: true };
      if (token.value === "false") return { kind: "literal", value: false };
      if (token.value === "null") return { kind: "literal", value: null };
      if (this.isPunctuation("(")) return this.call(token, depth);
      if (Object.hasOwn(numberFunctions, token.value)) {
        throw new ExpressionError(
          `${token.value} is a function; call it as ${token.value}(...)`,
          token.position,
        );
      }
      if (!this.names.includes(token.value)) this.names.push(token.value);
      return { kind: "name", name: token.value };
    }
    if (token.type === "punctuation" && token.value === "(") {
      const inner = this.conditional(depth + 1);
      this.expect(")");
      return inner;
    }
    if (token.type === "end")
      throw new ExpressionError("The expression ends too soon", token.position);
    throw new ExpressionError(`Unexpected "${token.value}"`, token.position);
  }

  call(token: Token & { type: "name" }, depth: number): ExpressionNode {
    const spec = Object.hasOwn(numberFunctions, token.value)
      ? numberFunctions[token.value]
      : undefined;
    if (spec === undefined) {
      throw new ExpressionError(
        `Unknown function ${token.value}; use one of ${expressionFunctions.map((item) => item.name).join(", ")}`,
        token.position,
      );
    }
    this.expect("(");
    const args: ExpressionNode[] = [];
    if (!this.isPunctuation(")")) {
      for (;;) {
        args.push(this.conditional(depth + 1));
        if (this.isPunctuation(",")) {
          this.take();
          continue;
        }
        break;
      }
    }
    this.expect(")");
    const [least, most] = spec.arity;
    if (args.length < least || args.length > most) {
      const range = least === most ? `${least}` : `${least} to ${most}`;
      throw new ExpressionError(
        `${token.value} takes ${range} argument${most === 1 ? "" : "s"}`,
        token.position,
      );
    }
    return { kind: "call", name: token.value, args };
  }
}

/** Parses an expression. Never throws; a problem is returned with its position. */
export function parseExpression(source: string): ExpressionParse {
  if (typeof source !== "string" || source.trim() === "") {
    return { ok: false, message: "The expression is empty", position: 0 };
  }
  if (source.length > maxExpressionLength) {
    return {
      ok: false,
      message: `The expression is longer than ${maxExpressionLength} characters`,
      position: maxExpressionLength,
    };
  }
  try {
    const parser = new ExpressionParser(tokenize(source));
    const ast = parser.parse();
    return { ok: true, expression: { source, ast, names: parser.names } };
  } catch (error) {
    if (error instanceof ExpressionError) {
      return { ok: false, message: error.message, position: error.position };
    }
    throw error;
  }
}

function truthy(value: ExpressionValue): boolean {
  return value !== null && value !== false && value !== 0 && value !== "";
}

function finite(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function binary(operator: BinaryOperator, left: ExpressionValue, right: ExpressionValue) {
  if (operator === "==") return left === right;
  if (operator === "!=") return left !== right;
  if (operator === "+") {
    if (typeof left === "number" && typeof right === "number") return finite(left + right);
    const text = (value: ExpressionValue) =>
      typeof value === "string" || typeof value === "number" ? String(value) : undefined;
    const a = text(left);
    const b = text(right);
    return a === undefined || b === undefined ? null : a + b;
  }
  if (operator === "<" || operator === "<=" || operator === ">" || operator === ">=") {
    const comparable =
      (typeof left === "number" && typeof right === "number") ||
      (typeof left === "string" && typeof right === "string");
    if (!comparable) return null;
    if (operator === "<") return left < right;
    if (operator === "<=") return left <= right;
    if (operator === ">") return left > right;
    return left >= right;
  }
  if (typeof left !== "number" || typeof right !== "number") return null;
  if (operator === "-") return finite(left - right);
  if (operator === "*") return finite(left * right);
  if (right === 0) return null;
  if (operator === "/") return finite(left / right);
  return finite(left % right);
}

function run(node: ExpressionNode, read: (name: string) => unknown): ExpressionValue {
  if (node.kind === "literal") return node.value;
  if (node.kind === "name") {
    const value = read(node.name);
    if (typeof value === "number") return finite(value);
    if (typeof value === "string" || typeof value === "boolean") return value;
    return null;
  }
  if (node.kind === "unary") {
    const operand = run(node.operand, read);
    if (node.operator === "!") return !truthy(operand);
    return typeof operand === "number" ? finite(-operand) : null;
  }
  if (node.kind === "conditional") {
    return run(truthy(run(node.test, read)) ? node.then : node.otherwise, read);
  }
  if (node.kind === "call") {
    const spec = numberFunctions[node.name];
    if (spec === undefined) return null;
    const args: number[] = [];
    for (const argument of node.args) {
      const value = run(argument, read);
      if (typeof value !== "number") return null;
      args.push(value);
    }
    return finite(spec.run(args));
  }
  const left = run(node.left, read);
  if (node.operator === "&&") return truthy(left) ? run(node.right, read) : left;
  if (node.operator === "||") return truthy(left) ? left : run(node.right, read);
  return binary(node.operator, left, run(node.right, read));
}

/**
 * Evaluates an expression. `read` supplies the value of a bound name; anything unset or not a
 * string, number, or boolean reads as `null`, and an operation on `null` gives `null`. The
 * result is never `NaN` or infinite.
 */
export function evaluateExpression(
  expression: Expression | string,
  read: ((name: string) => unknown) | Readonly<Record<string, unknown>>,
): ExpressionValue {
  let parsed: Expression;
  if (typeof expression === "string") {
    const result = parseExpression(expression);
    if (!result.ok) return null;
    parsed = result.expression;
  } else {
    parsed = expression;
  }
  const reader =
    typeof read === "function"
      ? read
      : (name: string) => (Object.hasOwn(read, name) ? read[name] : undefined);
  return run(parsed.ast, reader);
}
