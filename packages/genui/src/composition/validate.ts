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

/** Apply the same required-name rule to literals, expressions and bound state. */
export function validateField(
  name: string,
  schema: PropSchema | PropShape,
  value: unknown,
  required: boolean,
): ReturnType<typeof validateProp> {
  const checked = validateProp(schema, value);
  if (
    checked.ok &&
    required &&
    ["label", "title", "caption"].includes(name) &&
    typeof checked.value === "string" &&
    checked.value.trim() === ""
  )
    return { ok: false, message: "An accessible name must not be empty." };
  return checked;
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
  const parsed =
    typeof input === "string" ? parsePartialJsx(input, { final: options.complete ?? true }) : input;
  return createJsxValidation(options).read(parsed);
}

type Cursor = { next: number; accepted: number };

/** Consumes an append-only parse tree, resuming at each open parent's first unfinished child. */
export function createJsxValidation(options: ValidateJsxOptions, scopeRoot = "") {
  const complete = options.complete ?? true;
  const frames = new WeakMap<
    JsxElement,
    { result: ValidJsxElement; owner?: ValidJsxElement | undefined; cursor: Cursor } | null
  >();
  const byKey = new Map<string, ValidJsxNode>();
  const root: Cursor = { next: 0, accepted: 0 };
  const nodes: ValidJsxNode[] = [];
  const pendingIdentities = new Map<string, Set<string>>();
  const errors: GenUIError[] = [];
  const ancestors: ValidJsxElement[] = [];
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
  function open(node: JsxElement) {
    const entry = options.vocabulary.get(node.name);
    if (!entry) {
      report(node.key, "unknown-type", `${node.name} is not in this vocabulary.`);
      return undefined;
    }
    const parent = ancestors.at(-1);
    const requiredParents = entry.parents;
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
    const identity = entry.identity;
    let owner: ValidJsxElement | undefined;
    if (identity) {
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ancestors[i]!.name === identity.scope) {
          owner = ancestors[i];
          break;
        }
      }
    }
    if (identity && !owner) {
      report(node.key, "invalid-prop", `${node.name} needs an enclosing ${identity.scope}.`);
      return undefined;
    }
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
      const bound = field.name === entry.binding?.prop && binding;
      let value = node.props[field.name];
      if (bound) {
        if (Object.hasOwn(node.props, field.name)) {
          report(
            `${node.key}/${field.name}`,
            "binding",
            `bind already supplies ${field.name}. Remove the explicit prop.`,
          );
          return undefined;
        }
        value = options.state?.initial[bound];
      }
      if (field.name === "name" && value === undefined && binding !== undefined) value = binding;
      if (value === undefined && field.optional) continue;
      if (value === undefined) {
        report(`${node.key}/${field.name}`, "missing-prop", `${node.name} requires ${field.name}.`);
        return undefined;
      }
      const source = expressionSource(value);
      if (field.name === identity?.prop && (source !== undefined || typeof value !== "string")) {
        report(
          `${node.key}/${field.name}`,
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
      const checked = validateField(field.name, field.schema, literal, !field.optional);
      if (!checked.ok) {
        report(`${node.key}/${field.name}`, "invalid-prop", checked.message);
        if (bound || !field.optional) return undefined;
        continue;
      }
      if (bound) continue;
      if (source === undefined) props[field.name] = checked.value as JsonValue;
      else props[field.name] = value;
    }
    if (
      identity?.matchesBoundValue &&
      owner?.binding &&
      !options.state?.accepts(owner.binding, props[identity.prop])
    ) {
      report(
        `${node.key}/${identity.prop}`,
        "binding",
        "This option is outside the bound state's allowed values.",
      );
      return undefined;
    }
    const result: ValidJsxElement = { ...node, props, entry, children: [] };
    if (id !== undefined) result.id = id;
    if (binding !== undefined) result.binding = binding;
    return { result, owner, cursor: { next: 0, accepted: 0 } };
  }

  function scan(
    children: JsxNode[],
    accepted: ValidJsxNode[],
    cursor: Cursor,
    parent?: ValidJsxElement,
  ) {
    accepted.length = cursor.accepted;
    for (let i = cursor.next; i < children.length; i++) {
      const child = children[i]!;
      let allowed = true;
      if (parent) {
        const rule = parent.entry.children;
        if (!rule || ((rule === "text" || rule === "label") && child.kind === "element")) {
          allowed = false;
          if (child.kind !== "text" || child.text.trim())
            report(child.key, "invalid-prop", `${parent.name} does not accept this child.`);
        } else if (
          Array.isArray(rule) &&
          (child.kind !== "element" || !rule.includes(child.name))
        ) {
          allowed = false;
          if (child.kind !== "text" || child.text.trim())
            report(
              child.key,
              "invalid-prop",
              `${parent.name} accepts ${rule.join(", ")} children.`,
            );
        }
      }
      if (allowed) {
        const validated = visit(child);
        if (validated) {
          accepted.push(validated);
          byKey.set(child.key, validated);
        } else byKey.delete(child.key);
      }
      if (child.closed) {
        cursor.next = i + 1;
        cursor.accepted = accepted.length;
      }
    }
  }
  function visit(node: JsxNode): ValidJsxNode | undefined {
    if (node.kind === "expression") {
      if (!expression(node.source, node.key)) return undefined;
      return node;
    }
    if (node.kind === "text") return node;
    let frame = frames.get(node);
    if (frame === undefined) {
      frame = open(node) ?? null;
      frames.set(node, frame);
    }
    if (!frame) return;
    const { result, owner, cursor } = frame;
    const { entry, props } = result;
    const identity = entry.identity;
    result.closed = node.closed;
    ancestors.push(result);
    scan(node.children, result.children, cursor, result);
    ancestors.pop();
    if (
      (entry.children === "text" || entry.children === "label") &&
      !result.children.some(
        (child) =>
          child.kind === "expression" || (child.kind === "text" && child.text.trim() !== ""),
      )
    ) {
      if (node.closed) report(node.key, "missing-prop", `${node.name} requires text children.`);
      return undefined;
    }
    if (
      entry.children === "label" &&
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
    if (identity && owner) {
      const value = props[identity.prop];
      if (typeof value !== "string") {
        report(
          `${node.key}/${identity.prop}`,
          "invalid-prop",
          "A collection item needs a fixed string identity.",
        );
        return undefined;
      }
      const collection = `${owner.key}/${node.name}`;
      if (identities.get(collection)?.has(value) || pendingIdentities.get(collection)?.has(value)) {
        report(`${node.key}/${identity.prop}`, "invalid-prop", "Collection values must be unique.");
        return undefined;
      }
      // An open ancestor's postorder claim can still lose to a newly arrived descendant.
      const claims = node.closed ? identities : pendingIdentities;
      const values = claims.get(collection) ?? new Set<string>();
      values.add(value);
      claims.set(collection, values);
    }
    return result;
  }
  return {
    nodeAt(key: string) {
      const node = byKey.get(key);
      if (!node) return;
      // A descendant may have finished before its enclosing label or identity was accepted.
      for (
        let end = key.lastIndexOf("/children/");
        end > scopeRoot.length;
        end = key.lastIndexOf("/children/", end - 1)
      ) {
        if (!byKey.has(key.slice(0, end))) return;
      }
      return node;
    },
    read(tree: JsxParse) {
      pendingIdentities.clear();
      for (const error of tree.errors) report(error.path, error.code, error.message);
      scan(tree.nodes, nodes, root);
      return { nodes, errors };
    },
  };
}
