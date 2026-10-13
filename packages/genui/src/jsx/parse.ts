import { parseExpression } from "../expression/expression.js";
import {
  childPointer,
  maxJsonDepth,
  maxJsonLength,
  parsePartialJson,
  type JsonValue,
} from "../json/parse.js";
import { type GenUIError, type GenUIErrorCode } from "../validate/errors.js";

export type JsxElement = {
  kind: "element";
  key: string;
  name: string;
  props: Record<string, JsonValue>;
  children: JsxNode[];
  closed: boolean;
};
export type JsxText = { kind: "text"; key: string; text: string; closed: boolean };
export type JsxExpression = { kind: "expression"; key: string; source: string; closed: boolean };
export type JsxNode = JsxElement | JsxText | JsxExpression;
export type JsxParse = { nodes: JsxNode[]; errors: GenUIError[]; complete: boolean };

/** Limits count text and expressions as well as elements. */
export const maxJsxNodes = 1000;
export const maxJsxDepth = 40;
export const maxJsxLength = maxJsonLength;

const nameStart = /^[A-Za-z_]$/;
const namePart = /^[A-Za-z0-9_-]$/;
const space = /^\s$/u;
const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};
const loneSurrogate = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

function decodeText(source: string, closed: boolean): string {
  let text = source;
  if (!closed) {
    // An entity or surrogate pair split across chunks has not become text yet.
    text = text.replace(/&(?:[A-Za-z][A-Za-z0-9]*|#(?:[0-9]*|[xX][0-9a-fA-F]*))?$/, "");
    text = text.replace(/[\ud800-\udbff]$/, "");
  }
  return text
    .replace(/&([A-Za-z][A-Za-z0-9]*|#[0-9]+|#[xX][0-9a-fA-F]+);/g, (entity, name: string) => {
      if (Object.hasOwn(entities, name)) return entities[name]!;
      if (!name.startsWith("#")) return entity;
      let code = Number(name.slice(1));
      if (name[1] === "x" || name[1] === "X") code = Number.parseInt(name.slice(2), 16);
      if (
        !Number.isInteger(code) ||
        code <= 0 ||
        code > 0x10ffff ||
        (code >= 0xd800 && code <= 0xdfff)
      )
        return "�";
      return String.fromCodePoint(code);
    })
    .replace(loneSurrogate, "�");
}

class Reader {
  position = 0;
  count = 0;
  stopped = false;
  readonly errors: GenUIError[] = [];

  constructor(
    readonly source: string,
    readonly final: boolean,
  ) {}

  fail(path: string, message: string, code: GenUIErrorCode = "syntax") {
    if (this.final) this.errors.push({ path, code, message });
    this.stopped = true;
  }

  pending(path: string, message: string) {
    this.fail(path, message, "truncated");
  }

  skipSpace() {
    const start = this.position;
    while (this.position < this.source.length && space.test(this.source[this.position]!))
      this.position += 1;
    return this.position > start;
  }

  name(path: string): string | undefined {
    const start = this.position;
    const first = this.source[this.position];
    if (first === undefined) {
      this.pending(path, "The tag or attribute name is unfinished");
      return;
    }
    if (!nameStart.test(first)) {
      this.fail(path, "Expected a simple element or attribute name");
      return;
    }
    this.position += 1;
    while (this.position < this.source.length && namePart.test(this.source[this.position]!))
      this.position += 1;
    return this.source.slice(start, this.position);
  }

  quoted(path: string): string | undefined {
    const quote = this.source[this.position]!;
    const start = ++this.position;
    const end = this.source.indexOf(quote, start);
    if (end < 0) {
      this.pending(path, "The quoted attribute value is unfinished");
      return;
    }
    this.position = end + 1;
    return decodeText(this.source.slice(start, end), true);
  }

  braced(path: string): string | undefined {
    const start = ++this.position;
    const stack = ["}"];
    let quote = "";
    while (this.position < this.source.length) {
      const character = this.source[this.position]!;
      this.position += 1;
      if (quote !== "") {
        if (character === "\\") this.position += 1;
        else if (character === quote) quote = "";
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === "{" || character === "[" || character === "(") {
        if (stack.length >= maxJsonDepth) {
          this.fail(path, `Braced values may nest at most ${maxJsonDepth} levels`, "limit");
          return;
        }
        if (character === "{") stack.push("}");
        else if (character === "[") stack.push("]");
        else stack.push(")");
      } else if (character === "}" || character === "]" || character === ")") {
        if (stack.pop() !== character) {
          this.fail(path, "Mismatched delimiters in a braced value");
          return;
        }
        if (stack.length === 0) return this.source.slice(start, this.position - 1).trim();
      }
    }
    this.pending(path, "The braced value is unfinished");
    return;
  }

  attribute(path: string): JsonValue | undefined {
    const character = this.source[this.position];
    if (character === '"' || character === "'") return this.quoted(path);
    if (character === undefined) {
      this.pending(path, "The attribute value is unfinished");
      return;
    }
    if (character !== "{") {
      this.fail(path, "Attribute values must be quoted strings or braced values");
      return;
    }
    const source = this.braced(path);
    if (source === undefined) return;
    const literal = parsePartialJson(source, { final: true });
    if (literal.complete) {
      // The streaming JSON reader tolerates some syntax that a finished JSX literal does not.
      try {
        return JSON.parse(source) as JsonValue;
      } catch {
        this.fail(path, "Braced literal values must use valid JSON");
        return;
      }
    }
    if (source.startsWith("[") || source.startsWith("{")) {
      this.fail(path, "Braced arrays and objects must use bounded, valid JSON");
      return;
    }
    const expression = parseExpression(source);
    if (!expression.ok) {
      this.fail(path, expression.message, "expression");
      return;
    }
    return { $expr: source };
  }

  element(path: string, depth: number): JsxElement | undefined {
    if (depth >= maxJsxDepth) {
      this.fail(path, `Elements may nest at most ${maxJsxDepth} levels`, "limit");
      return;
    }
    this.position += 1;
    const name = this.name(path);
    if (name === undefined) return;
    const props: Record<string, JsonValue> = {};
    let closed = false;
    for (;;) {
      const separated = this.skipSpace();
      const character = this.source[this.position];
      if (character === undefined) {
        this.pending(path, "The opening tag is unfinished");
        return;
      }
      if (character === ">") {
        this.position += 1;
        break;
      }
      if (character === "/") {
        if (this.source[this.position + 1] === undefined)
          this.pending(path, "The self-closing tag is unfinished");
        else if (this.source[this.position + 1] !== ">") this.fail(path, 'Expected ">" after "/"');
        if (this.stopped) return;
        this.position += 2;
        closed = true;
        break;
      }
      if (!separated) {
        this.fail(path, "Separate attributes from the tag name and each other with whitespace");
        return;
      }
      const prop = this.name(path);
      if (prop === undefined) return;
      const propPath = childPointer(`${path}/props`, prop);
      if (Object.hasOwn(props, prop)) {
        this.fail(propPath, `The attribute ${prop} is written more than once`);
        return;
      }
      const afterName = this.position;
      this.skipSpace();
      let value: JsonValue | undefined = true;
      if (this.source[this.position] === "=") {
        this.position += 1;
        this.skipSpace();
        value = this.attribute(propPath);
        if (value === undefined) return;
      } else {
        // The next iteration must observe the separator after a shorthand boolean.
        this.position = afterName;
      }
      Object.defineProperty(props, prop, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    const node: JsxElement = { kind: "element", key: path, name, props, children: [], closed };
    if (!closed) node.closed = this.children(node.children, `${path}/children`, depth + 1, name);
    return node;
  }

  children(nodes: JsxNode[], path: string, depth: number, parent?: string): boolean {
    while (!this.stopped && this.position < this.source.length) {
      const key = childPointer(path, nodes.length);
      if (this.source.startsWith("</", this.position)) {
        if (parent === undefined) {
          this.fail(key, "Unexpected closing tag");
          return false;
        }
        this.position += 2;
        const name = this.name(key);
        if (name === undefined) return false;
        this.skipSpace();
        if (this.source[this.position] === undefined)
          this.pending(key, "The closing tag is unfinished");
        else if (this.source[this.position] !== ">")
          this.fail(key, 'Expected ">" after the closing tag name');
        else if (name !== parent) this.fail(key, `Expected </${parent}> but found </${name}>`);
        if (this.stopped) return false;
        this.position += 1;
        return true;
      }
      if (this.count >= maxJsxNodes) {
        // Whitespace-only gaps do not consume the node budget.
        if (space.test(this.source[this.position]!)) {
          this.skipSpace();
          continue;
        }
        this.fail(key, `The response may contain at most ${maxJsxNodes} nodes`, "limit");
        return false;
      }
      const character = this.source[this.position];
      let node: JsxNode | undefined;
      if (character === "<") {
        this.count += 1;
        node = this.element(key, depth);
      } else if (character === "{") {
        const source = this.braced(key);
        if (source === undefined) return false;
        const expression = parseExpression(source);
        if (!expression.ok) {
          this.fail(key, expression.message, "expression");
          return false;
        }
        this.count += 1;
        node = { kind: "expression", key, source, closed: true };
      } else {
        const start = this.position;
        while (
          this.position < this.source.length &&
          this.source[this.position] !== "<" &&
          this.source[this.position] !== "{"
        )
          this.position += 1;
        const closed = this.position < this.source.length || this.final;
        const text = decodeText(this.source.slice(start, this.position), closed);
        // A space between scalar expressions is visible text. Wait for the next expression
        // before emitting it, so indentation and unfinished gaps cannot change sibling keys.
        const expressionGap =
          text !== "" && this.source[this.position] === "{" && nodes.at(-1)?.kind === "expression";
        if (text.trim() !== "" || expressionGap) {
          this.count += 1;
          node = { kind: "text", key, text, closed };
        }
      }
      if (node !== undefined) nodes.push(node);
    }
    if (parent !== undefined && !this.stopped)
      this.pending(path, `The element <${parent}> is missing its closing tag`);
    return parent === undefined && !this.stopped;
  }
}

/** Parses data-shaped JSX, never JavaScript. Incomplete tags and expressions are withheld. */
export function parsePartialJsx(source: string, options: { final?: boolean } = {}): JsxParse {
  const final = options.final === true;
  const reader = new Reader(source.slice(0, maxJsxLength), final);
  const nodes: JsxNode[] = [];
  reader.children(nodes, "", 0);
  if (source.length > maxJsxLength)
    reader.fail("", `The response is longer than ${maxJsxLength} characters`, "limit");
  return {
    nodes,
    errors: reader.errors,
    complete: !reader.stopped && nodes.length > 0 && nodes.every((node) => node.closed),
  };
}
