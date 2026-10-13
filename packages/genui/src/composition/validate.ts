import { isShape, shapeEntries, type PropSchema, type PropShape } from "../catalog/schema.js";
import { evaluateExpression, parseExpression } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";
import { parsePartialJsx, type JsxElement, type JsxNode, type JsxParse } from "../jsx/parse.js";
import { maxErrors, type GenUIError } from "../validate/errors.js";
import { type Vocabulary } from "./spec.js";
import { type StateContract } from "./state.js";

export type ValidJsxElement = Omit<JsxElement, "children"> & {
  entry: Vocabulary["specs"][number];
  id?: string;
  binding?: string;
  children: ValidJsxNode[];
};
export type ValidJsxNode = Exclude<JsxNode, JsxElement> | ValidJsxElement;

export type ValidateJsxOptions = {
  vocabulary: Vocabulary;
  state?: StateContract | undefined;
  complete?: boolean | undefined;
};

/** Validates a finished prop, including the schema library's refinements and transforms. */
export function validateProp(
  schema: PropSchema | PropShape,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (isShape(schema)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return { ok: false, message: "Expected an object." };
    }
    const result: Record<string, unknown> = {};
    for (const field of shapeEntries(schema)) {
      const item = Object.getOwnPropertyDescriptor(value, field.name)?.value as unknown;
      if (item === undefined && field.optional) continue;
      const checked = validateProp(field.schema, item);
      if (!checked.ok) return checked;
      result[field.name] = checked.value;
    }
    return { ok: true, value: result };
  }
  try {
    const result = schema["~standard"].validate(value);
    if (result instanceof Promise) {
      void result.catch(() => {});
      return { ok: false, message: "GenUI prop validators must be synchronous." };
    }
    if (result.issues) return { ok: false, message: result.issues[0]?.message ?? "Invalid prop." };
    return { ok: true, value: result.value };
  } catch {
    return { ok: false, message: "The prop validator rejected this value." };
  }
}

export function expressionSource(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const source = Object.getOwnPropertyDescriptor(value, "$expr")?.value as unknown;
  if (typeof source === "string" && Object.keys(value).length === 1) return source;
  return undefined;
}

/** Only declared state is visible to expressions. */
export function resolveExpressions(
  props: Readonly<Record<string, JsonValue>>,
  values: Readonly<Record<string, JsonValue>>,
): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => {
      const source = expressionSource(value);
      if (source === undefined) return [key, value];
      return [key, evaluateExpression(source, values)];
    }),
  );
}

const parents: Record<string, readonly string[]> = {
  Option: ["Select"],
  Item: ["List"],
  TabList: ["Tabs"],
  Tab: ["TabList"],
  TabPanel: ["Tabs"],
  Section: ["Accordion"],
};

export function needsTextName(name: string): boolean {
  return ["Heading", "Option", "Tab", "Button", "Link"].includes(name);
}

/** Protocol IDs identify mounted components; they are never DOM props. */
export function isComponentId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value);
}

/** Checks the declarative JSX tree. An unfinished opening tag never reaches this validator. */
export function validateJsx(
  input: string | JsxParse,
  options: ValidateJsxOptions,
): {
  nodes: ValidJsxNode[];
  errors: GenUIError[];
} {
  const complete = options.complete ?? true;
  let parsed = input;
  if (typeof input === "string") parsed = parsePartialJsx(input, { final: complete });
  const tree = parsed as JsxParse;
  const errors: GenUIError[] = [];
  const specs = new Map(options.vocabulary.specs.map((entry) => [entry.name, entry]));
  const identities = new Map<string, Set<string>>();
  const ids = new Set<string>();
  function report(path: string, code: GenUIError["code"], message: string) {
    if (complete && errors.length < maxErrors) errors.push({ path, code, message });
  }
  function expression(source: string, path: string): boolean {
    const result = parseExpression(source);
    if (!result.ok) {
      report(path, "expression", result.message);
      return false;
    }
    for (const name of result.expression.names) {
      if (!options.state || !Object.hasOwn(options.state.initial, name)) {
        report(path, "unknown-binding", `Declare state ${JSON.stringify(name)} before using it.`);
        return false;
      }
    }
    return true;
  }
  function visit(node: JsxNode, parent?: ValidJsxElement, owner = ""): ValidJsxNode | undefined {
    if (node.kind === "expression") {
      if (!expression(node.source, node.key)) return undefined;
      return node;
    }
    if (node.kind === "text") return node;
    const entry = specs.get(node.name);
    if (!entry) {
      report(node.key, "unknown-type", `${node.name} is not in this vocabulary.`);
      return undefined;
    }
    const requiredParents = parents[node.name];
    if (requiredParents && !requiredParents.includes(parent?.name ?? "")) {
      report(
        node.key,
        "invalid-prop",
        `${node.name} belongs inside ${requiredParents.join(" or ")}.`,
      );
      return undefined;
    }
    const props: Record<string, JsonValue> = {};
    let id: string | undefined;
    if (Object.hasOwn(node.props, "id")) {
      const value = node.props.id;
      if (!isComponentId(value)) {
        report(
          `${node.key}/id`,
          "invalid-prop",
          "A component id must be a simple identifier of at most 64 characters.",
        );
        return undefined;
      }
      if (ids.has(value)) {
        report(
          `${node.key}/id`,
          "invalid-prop",
          `Component id ${JSON.stringify(value)} must be unique.`,
        );
        return undefined;
      }
      ids.add(value);
      id = value;
    }
    if (["Select", "Tabs", "Accordion"].includes(node.name)) owner = node.key;
    const fields = shapeEntries(entry.props);
    const allowed = new Set(fields.map((field) => field.name));
    let binding: string | undefined;
    if (Object.hasOwn(node.props, "bind")) {
      const name = node.props.bind;
      if (
        !entry.binding ||
        typeof name !== "string" ||
        !options.state ||
        !Object.hasOwn(options.state.initial, name)
      ) {
        report(
          `${node.key}/bind`,
          "binding",
          "Bind must name declared state on a bindable control.",
        );
        return undefined;
      }
      const initial = options.state.initial[name];
      let matches = typeof initial === entry.binding.kind;
      if (entry.binding.kind === "strings")
        matches = Array.isArray(initial) && initial.every((value) => typeof value === "string");
      if (!matches) {
        report(`${node.key}/bind`, "binding", `${node.name} needs ${entry.binding.kind} state.`);
        return undefined;
      }
      binding = name;
    }
    for (const key of Object.keys(node.props)) {
      if (key !== "bind" && key !== "id" && !allowed.has(key))
        report(`${node.key}/${key}`, "unknown-prop", `${node.name} has no ${key} prop.`);
    }
    for (const field of fields) {
      let value = node.props[field.name];
      if (field.name === "name" && value === undefined && binding !== undefined) value = binding;
      if (value === undefined && field.optional) continue;
      if (value === undefined) {
        report(`${node.key}/${field.name}`, "missing-prop", `${node.name} requires ${field.name}.`);
        return undefined;
      }
      const source = expressionSource(value);
      if (field.name === "value" && parents[node.name] && source !== undefined) {
        report(
          `${node.key}/value`,
          "invalid-prop",
          "A collection item's value must be a fixed string.",
        );
        return undefined;
      }
      let literal: unknown = value;
      if (source !== undefined) {
        if (!expression(source, `${node.key}/${field.name}`)) return undefined;
        literal = evaluateExpression(source, options.state?.initial ?? {});
      }
      const checked = validateProp(field.schema, literal);
      if (!checked.ok) {
        report(`${node.key}/${field.name}`, "invalid-prop", checked.message);
        if (!field.optional) return undefined;
        continue;
      }
      if (
        ["label", "title", "caption"].includes(field.name) &&
        typeof checked.value === "string" &&
        checked.value.trim() === "" &&
        !field.optional
      ) {
        report(
          `${node.key}/${field.name}`,
          "invalid-prop",
          "An accessible name must not be empty.",
        );
        return undefined;
      }
      if (source === undefined) props[field.name] = checked.value as JsonValue;
      else props[field.name] = value;
    }
    if (
      node.name === "Option" &&
      parent?.binding &&
      !options.state?.accepts(parent.binding, props.value)
    ) {
      report(
        `${node.key}/value`,
        "binding",
        "This option is outside the bound state's allowed values.",
      );
      return undefined;
    }
    const result: ValidJsxElement = { ...node, props, entry, children: [] };
    if (id !== undefined) result.id = id;
    if (binding !== undefined) result.binding = binding;
    for (const child of node.children) {
      if (entry.children === undefined || (entry.children === "text" && child.kind === "element")) {
        if (child.kind !== "text" || child.text.trim() !== "")
          report(child.key, "invalid-prop", `${node.name} does not accept this child.`);
        continue;
      }
      if (
        Array.isArray(entry.children) &&
        (child.kind !== "element" || !entry.children.includes(child.name))
      ) {
        if (child.kind !== "text" || child.text.trim() !== "")
          report(
            child.key,
            "invalid-prop",
            `${node.name} accepts ${entry.children.join(", ")} children.`,
          );
        continue;
      }
      const validated = visit(child, result, owner);
      if (validated) result.children.push(validated);
    }
    if (
      entry.children === "text" &&
      !result.children.some(
        (child) =>
          child.kind === "expression" || (child.kind === "text" && child.text.trim() !== ""),
      )
    ) {
      if (node.closed) report(node.key, "missing-prop", `${node.name} requires text children.`);
      return undefined;
    }
    if (
      needsTextName(node.name) &&
      !result.children.some((child) => child.kind === "text" && child.text.trim() !== "")
    ) {
      // A literal label can stream immediately. An expression-only label must be complete and
      // render through the client so a later state change cannot leave an unnamed control.
      if (!node.closed) return undefined;
      const text = result.children
        .map((child) => {
          if (child.kind === "text") return child.text;
          if (child.kind !== "expression") return "";
          const value = evaluateExpression(child.source, options.state?.initial ?? {});
          if (typeof value === "string" || typeof value === "number") return String(value);
          return "";
        })
        .join("");
      if (text.trim() === "") {
        report(node.key, "missing-prop", `${node.name} requires visible text.`);
        return undefined;
      }
    }
    if (parents[node.name] && typeof props.value === "string") {
      const collection = `${owner}/${node.name}`;
      const values = identities.get(collection) ?? new Set<string>();
      if (values.has(props.value)) {
        report(`${node.key}/value`, "invalid-prop", "Collection values must be unique.");
        return undefined;
      }
      values.add(props.value);
      identities.set(collection, values);
    }
    return result;
  }
  for (const error of tree.errors) report(error.path, error.code, error.message);
  const nodes: ValidJsxNode[] = [];
  for (const node of tree.nodes) {
    const valid = visit(node);
    if (valid) nodes.push(valid);
  }
  return { nodes, errors };
}
