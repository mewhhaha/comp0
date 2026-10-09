import { type z } from "zod";
import { catalog as defaultCatalog } from "../catalog/catalog.js";
import { defOf, describeType, isOptional, unwrap } from "../catalog/describe-schema.js";
import { markerOf } from "../catalog/schema.js";
import { type CatalogEntry } from "../catalog/types.js";
import { parseExpression } from "../expression/expression.js";
import {
  childPointer,
  parsePartialJson,
  type JsonValue,
  type PartialParse,
} from "../json/parse.js";
import { maxItems, safeHref, safeImageSrc } from "../safe.js";
import { maxErrors, type GenUIError, type GenUIErrorCode } from "./errors.js";
import { Binding, Computed, ValidNode } from "./values.js";

/** The most components one response may hold; the rest are left out. */
export const maxNodes = 1000;
/** The deepest nesting of components that is rendered. */
export const maxNodeDepth = 40;

export type ValidateOptions = {
  /** The components a response may use; defaults to the built-in catalog. */
  catalog?: readonly CatalogEntry[] | undefined;
  /**
   * Whether the response is finished. While it is not, nothing is reported as an error:
   * components that are still being written are expected to be incomplete. Defaults to true.
   */
  complete?: boolean | undefined;
  /** Names that already have a value (the keys of a saved state); expressions may read them. */
  known?: Iterable<string> | undefined;
};

export type ValidatedResponse = {
  /** The component tree to render, or `undefined` while nothing renderable has arrived. */
  root: ValidNode | undefined;
  /** Problems to send back to the model; always empty while the response is still streaming. */
  errors: GenUIError[];
  /** Whether the response was finished when it was validated. */
  complete: boolean;
  /** Every binding name the response declares and the first initial value written for it. */
  bindings: ReadonlyMap<string, JsonValue | undefined>;
};

type Checked = { ok: true; value: unknown } | { ok: false };
const failed: Checked = { ok: false };
const accepted = (value: unknown): Checked => ({ ok: true, value });

type Context = {
  index: ReadonlyMap<string, CatalogEntry>;
  open: ReadonlySet<string>;
  reporting: boolean;
  quiet: number;
  errors: GenUIError[];
  omitted: number;
  declarations: { name: string; initial: JsonValue | undefined }[];
  expressions: { path: string; source: string; names: readonly string[]; component?: string }[];
  nodes: number;
  depth: number;
  nodeLimitReported: boolean;
  component: string | undefined;
};

const catalogIndexes = new WeakMap<readonly CatalogEntry[], Map<string, CatalogEntry>>();

function indexOf(catalog: readonly CatalogEntry[]): Map<string, CatalogEntry> {
  let index = catalogIndexes.get(catalog);
  if (index === undefined) {
    index = new Map(catalog.map((entry) => [entry.name, entry]));
    catalogIndexes.set(catalog, index);
  }
  return index;
}

function report(context: Context, path: string, code: GenUIErrorCode, message: string) {
  if (!context.reporting || context.quiet > 0) return;
  if (context.errors.length >= maxErrors) {
    context.omitted += 1;
    return;
  }
  const error: GenUIError = { path, code, message };
  if (context.component !== undefined) error.component = context.component;
  context.errors.push(error);
}

/** Reports a problem unless the value is still being written. */
function reportClosed(
  context: Context,
  path: string,
  code: GenUIErrorCode,
  message: string,
  openPath: string = path,
) {
  if (context.open.has(openPath)) return;
  report(context, path, code, message);
}

function describeJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (typeof value === "object") return "an object";
  if (typeof value === "string") return "a string";
  if (typeof value === "number") return "a number";
  if (typeof value === "boolean") return "a boolean";
  return "an unsupported value";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mismatch(context: Context, path: string, schema: z.ZodType, value: unknown): Checked {
  reportClosed(
    context,
    path,
    "invalid-prop",
    `expected ${describeType(schema)}, got ${describeJson(value)}`,
  );
  return failed;
}

/** Runs a check without reporting or recording bindings and expressions. */
function attempt(context: Context, run: () => Checked): Checked {
  const declarations = context.declarations.length;
  const expressions = context.expressions.length;
  context.quiet += 1;
  let result: Checked;
  try {
    result = run();
  } finally {
    context.quiet -= 1;
  }
  // The winning option is run again with reporting on, so its effects are recorded once.
  context.declarations.length = declarations;
  context.expressions.length = expressions;
  return result;
}

function checkBindable(
  inner: z.ZodType,
  binding: z.ZodObject,
  value: unknown,
  path: string,
  context: Context,
): Checked {
  if (!isRecord(value) || !Object.hasOwn(value, "$bind")) return check(inner, value, path, context);
  const name = value.$bind;
  const namePath = childPointer(path, "$bind");
  if (context.open.has(namePath)) return failed;
  if (typeof name !== "string" || !(binding.shape.$bind as z.ZodType).safeParse(name).success) {
    report(
      context,
      namePath,
      "binding",
      '$bind must be a name of letters, digits, and underscores that does not start with a digit, at most 64 characters, such as "seats"',
    );
    return failed;
  }
  for (const key of Object.keys(value)) {
    if (key !== "$bind" && key !== "initial") {
      reportClosed(
        context,
        childPointer(path, key),
        "unknown-prop",
        `${key} is not a binding property; use $bind and initial`,
      );
    }
  }
  let initial: JsonValue | undefined;
  if (Object.hasOwn(value, "initial") && value.initial !== null) {
    const checked = check(inner, value.initial, childPointer(path, "initial"), context);
    if (checked.ok) initial = checked.value as JsonValue;
  }
  context.declarations.push({ name, initial });
  return accepted(new Binding(name, initial));
}

function checkComputed(inner: z.ZodType, value: unknown, path: string, context: Context): Checked {
  if (!isRecord(value) || !Object.hasOwn(value, "$expr")) return check(inner, value, path, context);
  const sourcePath = childPointer(path, "$expr");
  if (context.open.has(sourcePath)) return failed;
  const source = value.$expr;
  if (typeof source !== "string") {
    report(context, sourcePath, "expression", '$expr must be a string such as "seats * 12"');
    return failed;
  }
  for (const key of Object.keys(value)) {
    if (key !== "$expr") {
      reportClosed(
        context,
        childPointer(path, key),
        "unknown-prop",
        `${key} is not allowed next to $expr`,
      );
    }
  }
  const parsed = parseExpression(source);
  if (!parsed.ok) {
    reportClosed(
      context,
      sourcePath,
      "expression",
      `invalid expression ${JSON.stringify(source.slice(0, 80))} (at ${parsed.position}): ${parsed.message}`,
      path,
    );
    return failed;
  }
  const entry: Context["expressions"][number] = {
    path: sourcePath,
    source,
    names: parsed.expression.names,
  };
  if (context.component !== undefined) entry.component = context.component;
  context.expressions.push(entry);
  return accepted(new Computed(parsed.expression));
}

function checkObject(
  schema: z.ZodObject,
  value: unknown,
  path: string,
  context: Context,
  allowed: readonly string[] = [],
): Checked {
  if (!isRecord(value)) return mismatch(context, path, schema, value);
  const shape = schema.shape as Record<string, z.ZodType>;
  const result: Record<string, unknown> = {};
  let valid = true;
  for (const [key, child] of Object.entries(shape)) {
    const present = Object.hasOwn(value, key);
    const raw = present ? value[key] : undefined;
    const childPath = childPointer(path, key);
    if (raw === undefined) {
      if (!isOptional(child)) {
        reportClosed(
          context,
          childPath,
          "missing-prop",
          `required property ${key} is missing`,
          path,
        );
        valid = false;
      }
      continue;
    }
    const checked = check(child, raw, childPath, context);
    if (checked.ok) {
      if (checked.value !== undefined) result[key] = checked.value;
    } else if (!isOptional(child)) {
      valid = false;
    }
  }
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(shape, key) && !allowed.includes(key)) {
      reportClosed(
        context,
        childPointer(path, key),
        "unknown-prop",
        `${key} is not a property here; allowed properties: ${Object.keys(shape).join(", ")}`,
      );
    }
  }
  return valid ? accepted(result) : failed;
}

function check(schema: z.ZodType, value: unknown, path: string, context: Context): Checked {
  const marker = markerOf(schema);
  if (marker?.kind === "nodes") return checkNodes(value, path, context);
  if (marker?.kind === "bindable") {
    return checkBindable(marker.inner, marker.binding, value, path, context);
  }
  if (marker?.kind === "computed") return checkComputed(marker.inner, value, path, context);
  if (marker?.kind === "url") {
    if (typeof value !== "string") return mismatch(context, path, schema, value);
    // A URL that is still being written is not safe to use yet, and not wrong either.
    if (context.open.has(path)) return failed;
    const safe = marker.url === "image" ? safeImageSrc(value) : safeHref(value);
    if (safe === undefined) {
      report(
        context,
        path,
        "unsafe-url",
        marker.url === "image"
          ? "image URLs must be http(s) or relative; data:, javascript:, and other schemes are not loaded"
          : "links must be http(s), mailto:, tel:, relative, or #fragment URLs",
      );
      return failed;
    }
    return accepted(safe);
  }
  const def = defOf(schema);
  switch (def.type) {
    case "optional": {
      if (value === undefined) return accepted(undefined);
      const inner = def.innerType as z.ZodType;
      if (value === null) {
        // A structured-output response writes null for what it leaves out.
        const asNull = attempt(context, () => check(inner, null, path, context));
        return asNull.ok ? asNull : accepted(undefined);
      }
      return check(inner, value, path, context);
    }
    case "nullable":
      if (value === null) return accepted(null);
      return check(def.innerType as z.ZodType, value, path, context);
    case "default":
    case "readonly":
      return check(def.innerType as z.ZodType, value, path, context);
    case "lazy":
      return check((def.getter as () => z.ZodType)(), value, path, context);
    case "string":
      return typeof value === "string" ? accepted(value) : mismatch(context, path, schema, value);
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? accepted(value)
        : mismatch(context, path, schema, value);
    case "boolean":
      return typeof value === "boolean" ? accepted(value) : mismatch(context, path, schema, value);
    case "null":
      return value === null ? accepted(null) : mismatch(context, path, schema, value);
    case "unknown":
      return accepted(value);
    case "enum":
      return Object.values(def.entries ?? {}).includes(value as string)
        ? accepted(value)
        : mismatch(context, path, schema, value);
    case "literal":
      return (def.values ?? []).includes(value)
        ? accepted(value)
        : mismatch(context, path, schema, value);
    case "array": {
      if (!Array.isArray(value)) return mismatch(context, path, schema, value);
      const element = def.element as z.ZodType;
      const result: unknown[] = [];
      if (value.length > maxItems) {
        reportClosed(
          context,
          path,
          "limit",
          `at most ${maxItems} items are used; the rest are ignored`,
        );
      }
      for (let index = 0; index < Math.min(value.length, maxItems); index += 1) {
        const checked = check(element, value[index], childPointer(path, index), context);
        if (checked.ok) result.push(checked.value);
      }
      return accepted(result);
    }
    case "object":
      return checkObject(schema as z.ZodObject, value, path, context);
    case "union": {
      const options = def.options ?? [];
      for (const option of options) {
        const checked = attempt(context, () => check(option, value, path, context));
        if (checked.ok) return check(option, value, path, context);
      }
      // Explain the closest option: for an object, the first object shape in the union.
      if (isRecord(value)) {
        const shape = options.find((option) => defOf(option).type === "object");
        if (shape !== undefined) return check(shape, value, path, context);
      }
      return mismatch(context, path, schema, value);
    }
    default:
      return accepted(value);
  }
}

/** Whether a prop is a URL: one that is unsafe or still streaming leaves the text of a link. */
function isUrl(schema: z.ZodType): boolean {
  return markerOf(unwrap(schema))?.kind === "url";
}

function closest(name: string, names: Iterable<string>): string | undefined {
  let best: string | undefined;
  let distance = 3;
  const lower = name.toLowerCase();
  for (const candidate of names) {
    const other = candidate.toLowerCase();
    if (Math.abs(other.length - lower.length) >= distance) continue;
    const row = Array.from({ length: other.length + 1 }, (_, index) => index);
    for (let i = 1; i <= lower.length; i += 1) {
      let previous = row[0]!;
      row[0] = i;
      for (let j = 1; j <= other.length; j += 1) {
        const above = row[j]!;
        row[j] = Math.min(
          row[j]! + 1,
          row[j - 1]! + 1,
          previous + (lower[i - 1] === other[j - 1] ? 0 : 1),
        );
        previous = above;
      }
    }
    const found = row[other.length]!;
    if (found < distance) {
      distance = found;
      best = candidate;
    }
  }
  return best;
}

function checkNodes(value: unknown, path: string, context: Context): Checked {
  if (!Array.isArray(value)) {
    reportClosed(
      context,
      path,
      "invalid-prop",
      `expected an array of components, got ${describeJson(value)}`,
    );
    return failed;
  }
  const result: ValidNode[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const node = validateNodeAt(value[index], childPointer(path, index), context);
    if (node !== undefined) result.push(node);
  }
  return accepted(result);
}

function validateNodeAt(value: unknown, path: string, context: Context): ValidNode | undefined {
  const outerComponent = context.component;
  context.depth += 1;
  try {
    if (!isRecord(value)) {
      context.component = undefined;
      reportClosed(
        context,
        path,
        "not-a-component",
        `expected a component object like {"type": "Text", "text": "..."}, got ${describeJson(value)}`,
      );
      return undefined;
    }
    const typePath = childPointer(path, "type");
    // A type that is still being written names nothing yet.
    if (context.open.has(typePath)) return undefined;
    const type = value.type;
    if (typeof type !== "string") {
      context.component = undefined;
      if (Object.hasOwn(value, "type")) {
        report(
          context,
          typePath,
          "missing-type",
          `type must be a string naming a component, got ${describeJson(type)}`,
        );
      } else {
        reportClosed(context, path, "missing-type", 'the component has no "type"');
      }
      return undefined;
    }
    const entry = context.index.get(type);
    if (entry === undefined) {
      context.component = undefined;
      const suggestion = closest(type, context.index.keys());
      const hint =
        suggestion === undefined
          ? `use one of: ${[...context.index.keys()].join(", ")}`
          : `did you mean ${suggestion}?`;
      report(
        context,
        typePath,
        "unknown-type",
        `${JSON.stringify(type.slice(0, 40))} is not a component; ${hint}`,
      );
      return undefined;
    }
    if (context.depth > maxNodeDepth) {
      reportClosed(context, path, "limit", `components nest at most ${maxNodeDepth} levels deep`);
      return undefined;
    }
    context.nodes += 1;
    if (context.nodes > maxNodes) {
      if (!context.nodeLimitReported) {
        context.nodeLimitReported = true;
        report(
          context,
          path,
          "limit",
          `at most ${maxNodes} components are rendered; the rest are ignored`,
        );
      }
      return undefined;
    }
    context.component = entry.name;
    const props: Record<string, unknown> = {};
    // A component without everything its schema requires is withheld: it would be a control
    // without a name, or a chart without data. While streaming it appears once the rest arrives.
    let withheld = false;
    const shape = entry.props.shape as Record<string, z.ZodType>;
    for (const [key, child] of Object.entries(shape)) {
      const raw = Object.hasOwn(value, key) ? value[key] : undefined;
      const childPath = childPointer(path, key);
      if (raw === undefined) {
        if (!isOptional(child)) {
          reportClosed(
            context,
            childPath,
            "missing-prop",
            `required property ${key} is missing`,
            path,
          );
          withheld = true;
        }
        continue;
      }
      context.component = entry.name;
      const checked = check(child, raw, childPath, context);
      context.component = entry.name;
      if (checked.ok && checked.value !== undefined) props[key] = checked.value;
      else if (!isOptional(child) && !isUrl(child)) withheld = true;
    }
    for (const key of Object.keys(value)) {
      if (key !== "type" && !Object.hasOwn(shape, key)) {
        reportClosed(
          context,
          childPointer(path, key),
          "unknown-prop",
          `${key} is not a property of ${entry.name}; allowed: type, ${Object.keys(shape).join(", ")}`,
          path,
        );
      }
    }
    return withheld ? undefined : new ValidNode(path, entry, props);
  } finally {
    context.component = outerComponent;
    context.depth -= 1;
  }
}

function toParse(input: unknown, complete: boolean): PartialParse {
  if (typeof input === "string") return parsePartialJson(input, { final: complete });
  if (
    typeof input === "object" &&
    input !== null &&
    "open" in input &&
    "issues" in input &&
    "complete" in input
  ) {
    return input as PartialParse;
  }
  return { value: input as JsonValue | undefined, complete: true, open: new Set(), issues: [] };
}

/**
 * Validates a response against the catalog. The input is the response text (parsed here), a
 * {@link PartialParse}, or an already parsed object. It returns the component tree to render,
 * with props sanitized against each component's schema (a prop that does not fit is dropped,
 * unknown components and props are left out, unsafe URLs never survive), and the problems found.
 *
 * Problems are reported only when `complete` is true (the default), and never for the part of
 * the document that is still open.
 */
export function validateResponse(input: unknown, options: ValidateOptions = {}): ValidatedResponse {
  const complete = options.complete ?? true;
  const catalog = options.catalog ?? defaultCatalog;
  const parsed = toParse(input, complete);
  const context: Context = {
    index: indexOf(catalog),
    open: parsed.open,
    reporting: complete,
    quiet: 0,
    errors: [],
    omitted: 0,
    declarations: [],
    expressions: [],
    nodes: 0,
    depth: 0,
    nodeLimitReported: false,
    component: undefined,
  };
  for (const issue of parsed.issues) {
    report(
      context,
      issue.path,
      "syntax",
      `invalid JSON near offset ${issue.offset}: ${issue.message}`,
    );
  }
  if (complete && parsed.issues.length === 0 && !parsed.complete && parsed.value !== undefined) {
    const deepest = [...parsed.open].sort((a, b) => b.length - a.length)[0] ?? "";
    report(
      context,
      deepest,
      "truncated",
      "the response ended before the JSON was complete; write the whole document",
    );
  }
  let root: ValidNode | undefined;
  if (parsed.value !== undefined) root = validateNodeAt(parsed.value, "", context);
  else if (complete && parsed.issues.length === 0) {
    report(context, "", "syntax", "the response is empty; write one JSON component object");
  }

  const bindings = new Map<string, JsonValue | undefined>();
  for (const { name, initial } of context.declarations) {
    if (!bindings.has(name) || bindings.get(name) === undefined) bindings.set(name, initial);
  }
  const known = new Set(options.known ?? []);
  for (const expression of context.expressions) {
    for (const name of expression.names) {
      if (bindings.has(name) || known.has(name)) continue;
      context.component = expression.component;
      reportClosed(
        context,
        expression.path,
        "unknown-binding",
        `the expression ${JSON.stringify(expression.source.slice(0, 80))} reads ${name}, but no control binds that name; add {"$bind": "${name}"} to a control`,
        "",
      );
    }
  }
  if (context.omitted > 0) {
    context.errors.push({
      path: "",
      code: "limit",
      message: `${context.omitted} more problems are not listed`,
    });
  }
  return { root, errors: context.errors, complete, bindings };
}

/**
 * Validates one component object that is already parsed and finished, such as a node a model
 * returned from a tool call. Equivalent to `validateResponse(value, options)`.
 */
export function validateNode(value: unknown, options: ValidateOptions = {}): ValidatedResponse {
  return validateResponse(value, { ...options, complete: options.complete ?? true });
}
