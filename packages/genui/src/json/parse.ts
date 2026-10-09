/**
 * A tolerant, incremental JSON parser. A model writes a JSON document one chunk at a time; any
 * prefix of that document parses to the best complete tree it describes: open strings, arrays,
 * and objects are closed, and a key whose value has not started yet is dropped. The parser also
 * reports which paths are still open, so a renderer knows which nodes may still grow.
 */

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** A syntax problem the parser could not recover from; everything before it is still returned. */
export type ParseIssue = {
  /** JSON Pointer of the value being read when the problem was found. */
  path: string;
  message: string;
  /** Offset into the text where the problem was found. */
  offset: number;
};

export type PartialParse = {
  /** The best tree for the text so far; `undefined` while no value has started. */
  value: JsonValue | undefined;
  /** Whether the document is finished: a closed value and nothing but whitespace after it. */
  complete: boolean;
  /**
   * JSON Pointers (RFC 6901) of the values that may still grow: unclosed objects, arrays, and
   * strings, and a number that touches the end of the text. The root is `""`.
   */
  open: ReadonlySet<string>;
  /** Unrecoverable syntax problems; empty for every valid prefix. */
  issues: readonly ParseIssue[];
};

export type ParseOptions = {
  /**
   * The text will not grow. A number that ends the text is then complete, and trailing content
   * is reported. Defaults to false, the streaming case.
   */
  final?: boolean | undefined;
};

/** The deepest nesting of objects and arrays that is read; deeper content ends the parse. */
export const maxJsonDepth = 100;
/** The longest text that is read; the rest is ignored. */
export const maxJsonLength = 2_000_000;

const escapes: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

const completeNumber = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const loneSurrogate = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
const trailingHighSurrogate = /[\ud800-\udbff]$/;
const hex4 = /^[0-9a-fA-F]{4}$/;

/** Escapes a key for use in a JSON Pointer. */
export function escapePointer(key: string): string {
  return key.replaceAll("~", "~0").replaceAll("/", "~1");
}

/** Joins a pointer and a key or index. */
export function childPointer(path: string, key: string | number): string {
  return `${path}/${typeof key === "number" ? key : escapePointer(key)}`;
}

/** Sets an own data property, including a key such as `__proto__`, without touching prototypes. */
function setOwn(target: Record<string, JsonValue>, key: string, value: JsonValue) {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

const none = Symbol("none");
type Read = JsonValue | typeof none;

class Reader {
  readonly open = new Set<string>();
  readonly issues: ParseIssue[] = [];
  position = 0;
  /** Set once the text ended or broke; containers then stop and close themselves. */
  stopped = false;

  constructor(
    readonly text: string,
    readonly final: boolean,
  ) {}

  fail(path: string, message: string) {
    this.issues.push({ path, message, offset: this.position });
    this.stopped = true;
  }

  skipSpace() {
    const { text } = this;
    while (this.position < text.length) {
      const code = text.charCodeAt(this.position);
      // Space, tab, newline, carriage return, and a byte order mark.
      if (code === 32 || code === 9 || code === 10 || code === 13 || code === 0xfeff) {
        this.position += 1;
      } else {
        break;
      }
    }
  }

  atEnd() {
    return this.position >= this.text.length;
  }

  readValue(path: string, depth: number): Read {
    this.skipSpace();
    if (this.atEnd()) {
      this.stopped = true;
      return none;
    }
    const character = this.text[this.position]!;
    if (character === "{") return this.readObject(path, depth);
    if (character === "[") return this.readArray(path, depth);
    if (character === '"') return this.readString(path);
    if (character === "-" || (character >= "0" && character <= "9")) return this.readNumber(path);
    if (character === "t" || character === "f" || character === "n") return this.readLiteral(path);
    this.fail(path, `Unexpected character ${JSON.stringify(character)}`);
    return none;
  }

  readLiteral(path: string): Read {
    for (const [word, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      const rest = this.text.slice(this.position, this.position + word.length);
      if (rest === word) {
        this.position += word.length;
        return value;
      }
      // A literal cut short by the end of the text may still become this word.
      if (word.startsWith(rest) && this.position + rest.length >= this.text.length) {
        this.position = this.text.length;
        this.stopped = true;
        return none;
      }
    }
    this.fail(path, "Unexpected text; expected true, false, or null");
    return none;
  }

  readNumber(path: string): Read {
    const { text } = this;
    const start = this.position;
    let end = start;
    while (end < text.length && /[0-9+\-.eE]/.test(text[end]!)) end += 1;
    const token = text.slice(start, end);
    this.position = end;
    const touchesEnd = end >= text.length;
    if (completeNumber.test(token)) {
      const number = Number(token);
      if (!Number.isFinite(number)) {
        this.issues.push({ path, message: "Number is too large", offset: start });
        if (touchesEnd) this.markOpen(path);
        return null;
      }
      if (touchesEnd && !this.final) {
        // More digits may still follow.
        this.open.add(path);
        this.stopped = true;
      }
      return number;
    }
    if (touchesEnd && !this.final) {
      // `-`, `1.`, `1e`, `1e+`: a prefix of a number. Keep the part that is already a number.
      const trimmed = token.replace(/(?:[eE][+-]?|\.)$/, "");
      this.stopped = true;
      if (completeNumber.test(trimmed)) {
        this.open.add(path);
        return Number(trimmed);
      }
      return none;
    }
    this.fail(path, `Invalid number ${JSON.stringify(token.slice(0, 20))}`);
    return none;
  }

  markOpen(path: string) {
    if (!this.final) {
      this.open.add(path);
      this.stopped = true;
    }
  }

  readString(path: string): Read {
    const { text } = this;
    this.position += 1;
    let result = "";
    let chunkStart = this.position;
    for (;;) {
      if (this.position >= text.length) {
        result += text.slice(chunkStart);
        this.open.add(path);
        this.stopped = true;
        // A pair of surrogates split across two chunks is not a character yet.
        return result.replace(trailingHighSurrogate, "").replace(loneSurrogate, "�");
      }
      const character = text[this.position]!;
      if (character === '"') {
        result += text.slice(chunkStart, this.position);
        this.position += 1;
        return result.replace(loneSurrogate, "�");
      }
      if (character !== "\\") {
        this.position += 1;
        continue;
      }
      result += text.slice(chunkStart, this.position);
      const escape = text[this.position + 1];
      if (escape === undefined) {
        // The backslash is the last character: the escape is not written yet.
        this.position = text.length;
        chunkStart = text.length;
        continue;
      }
      if (escape === "u") {
        const digits = text.slice(this.position + 2, this.position + 6);
        if (digits.length < 4 && /^[0-9a-fA-F]*$/.test(digits)) {
          this.position = text.length;
          chunkStart = text.length;
          continue;
        }
        if (!hex4.test(digits)) {
          this.fail(path, "Invalid \\u escape in a string");
          return none;
        }
        result += String.fromCharCode(Number.parseInt(digits, 16));
        this.position += 6;
        chunkStart = this.position;
        continue;
      }
      const decoded = escapes[escape];
      if (decoded === undefined) {
        this.fail(path, `Invalid escape \\${escape} in a string`);
        return none;
      }
      result += decoded;
      this.position += 2;
      chunkStart = this.position;
    }
  }

  readArray(path: string, depth: number): Read {
    if (depth >= maxJsonDepth) {
      this.fail(path, `Nesting is deeper than ${maxJsonDepth} levels`);
      return none;
    }
    this.position += 1;
    const items: JsonValue[] = [];
    for (;;) {
      this.skipSpace();
      if (this.atEnd()) {
        this.open.add(path);
        this.stopped = true;
        return items;
      }
      if (this.text[this.position] === "]") {
        this.position += 1;
        return items;
      }
      const value = this.readValue(childPointer(path, items.length), depth + 1);
      if (value !== none) items.push(value);
      if (this.stopped) {
        this.open.add(path);
        return items;
      }
      this.skipSpace();
      if (this.atEnd()) {
        this.open.add(path);
        this.stopped = true;
        return items;
      }
      const next = this.text[this.position];
      if (next === ",") {
        this.position += 1;
      } else if (next !== "]") {
        this.fail(path, `Expected "," or "]" but found ${JSON.stringify(next)}`);
        this.open.add(path);
        return items;
      }
    }
  }

  readObject(path: string, depth: number): Read {
    if (depth >= maxJsonDepth) {
      this.fail(path, `Nesting is deeper than ${maxJsonDepth} levels`);
      return none;
    }
    this.position += 1;
    const entries: Record<string, JsonValue> = {};
    for (;;) {
      this.skipSpace();
      if (this.atEnd()) {
        this.open.add(path);
        this.stopped = true;
        return entries;
      }
      const character = this.text[this.position];
      if (character === "}") {
        this.position += 1;
        return entries;
      }
      if (character !== '"') {
        this.fail(path, `Expected a key or "}" but found ${JSON.stringify(character)}`);
        this.open.add(path);
        return entries;
      }
      // The key's own pointer is not known until it is read, and an unfinished key is dropped.
      const probe = this.readString(path);
      if (probe === none || this.stopped) {
        // An unfinished key is dropped; the object around it is still open.
        this.open.add(path);
        return entries;
      }
      const key = probe as string;
      this.skipSpace();
      if (this.atEnd()) {
        this.open.add(path);
        this.stopped = true;
        return entries;
      }
      if (this.text[this.position] !== ":") {
        this.fail(path, `Expected ":" after the key ${JSON.stringify(key.slice(0, 40))}`);
        this.open.add(path);
        return entries;
      }
      this.position += 1;
      const value = this.readValue(childPointer(path, key), depth + 1);
      if (value !== none) setOwn(entries, key, value);
      if (this.stopped) {
        this.open.add(path);
        return entries;
      }
      this.skipSpace();
      if (this.atEnd()) {
        this.open.add(path);
        this.stopped = true;
        return entries;
      }
      const next = this.text[this.position];
      if (next === ",") {
        this.position += 1;
      } else if (next !== "}") {
        this.fail(path, `Expected "," or "}" but found ${JSON.stringify(next)}`);
        this.open.add(path);
        return entries;
      }
    }
  }
}

/** Skips a Markdown code fence a model may wrap around the document. */
function unfence(text: string): { start: number; end: number } {
  let start = 0;
  let end = text.length;
  const opening = /^\s*```[A-Za-z0-9_-]*[ \t]*\r?\n/.exec(text);
  if (opening) {
    start = opening[0].length;
  } else if (/^\s*```[A-Za-z0-9_-]*\s*$/.test(text)) {
    // Only the fence so far.
    return { start: text.length, end: text.length };
  }
  if (start > 0) {
    const closing = /\s*`{3}\s*$/.exec(text);
    if (closing && closing.index >= start) end = closing.index;
  }
  return { start, end };
}

/**
 * Parses any prefix of a JSON document. See {@link PartialParse}. The text may be wrapped in a
 * Markdown code fence. Never throws.
 */
export function parsePartialJson(text: string, options: ParseOptions = {}): PartialParse {
  const final = options.final === true;
  const clipped = text.length > maxJsonLength ? text.slice(0, maxJsonLength) : text;
  const { start, end } = unfence(clipped);
  const reader = new Reader(clipped.slice(start, end), final);
  if (clipped.length < text.length) {
    reader.issues.push({
      path: "",
      message: `The response is longer than ${maxJsonLength} characters`,
      offset: maxJsonLength,
    });
  }
  const value = reader.readValue("", 0);
  let complete = !reader.stopped && value !== none && reader.issues.length === 0;
  if (complete) {
    reader.skipSpace();
    if (!reader.atEnd()) {
      reader.issues.push({
        path: "",
        message: "Unexpected content after the end of the document",
        offset: reader.position,
      });
      complete = false;
    }
  }
  // A number that ends a final document is closed; `final` made the reader treat it so.
  return {
    value: value === none ? undefined : value,
    complete,
    open: reader.open,
    issues: reader.issues,
  };
}
