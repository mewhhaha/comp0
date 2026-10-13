import {
  maxJsxDepth,
  maxJsxLength,
  maxJsxNodes,
  parsePartialJsx,
  type JsxElement,
  type JsxNode,
} from "../jsx/parse.js";
import { maxErrors, type GenUIError } from "../validate/errors.js";
import { type Vocabulary } from "./spec.js";
import { type StateContract } from "./state.js";
import { isComponentId, validateJsx, type ValidJsxElement, type ValidJsxNode } from "./validate.js";

type EditTarget = {
  target: string;
  expectedRevision: number;
  /** The complete target, retaining literal schema inputs and stable positional keys. */
  raw: JsxElement;
  /** The separately validated target; props hold schema outputs and exclude protocol metadata. */
  validated: ValidJsxElement;
};
export type JsxEditOperation =
  | (EditTarget & { kind: "update" })
  | (EditTarget & { kind: "append"; rawChildren: JsxNode[]; children: ValidJsxNode[] });

export type ValidateEditsOptions = {
  history: readonly string[];
  vocabulary: Vocabulary;
  state?: StateContract | undefined;
  /** Selects the children of one named hole envelope in each response. */
  scope?: string | undefined;
  /** Maximum accumulated direct roots in this view or hole. */
  max?: number | undefined;
};
export type ValidatedEdits = {
  operations: JsxEditOperation[];
  errors: GenUIError[];
  rawNodes: JsxNode[];
  nodes: ValidJsxNode[];
};

function copy(node: JsxNode, prefix = ""): JsxNode {
  const key = prefix + node.key;
  if (node.kind !== "element") return { ...node, key };
  return {
    ...node,
    key,
    props: { ...node.props },
    children: node.children.map((child) => copy(child, prefix)),
  };
}

function named(nodes: readonly ValidJsxNode[]): Map<string, ValidJsxElement>;
function named(nodes: readonly JsxNode[]): Map<string, JsxElement>;
function named(
  nodes: readonly (JsxNode | ValidJsxNode)[],
): Map<string, JsxElement | ValidJsxElement> {
  const result = new Map<string, JsxElement | ValidJsxElement>();
  function visit(node: JsxNode | ValidJsxNode) {
    if (node.kind !== "element") return;
    if (isComponentId(node.props.id)) result.set(node.props.id, node);
    // Validated nodes carry their ID outside props.
    if ("id" in node && isComponentId(node.id)) result.set(node.id, node);
    for (const child of node.children) visit(child);
  }
  for (const node of nodes) visit(node);
  return result;
}

/** Replays raw accepted responses, then validates one complete edit turn atomically. */
export function validateEdits(source: string, options: ValidateEditsOptions): ValidatedEdits {
  const max = options.max ?? maxJsxNodes;
  if (!Number.isInteger(max) || max < 1 || max > maxJsxNodes) {
    throw new Error(`An edit scope's max must be between 1 and ${maxJsxNodes}.`);
  }
  const errors: GenUIError[] = [];
  let document: JsxNode[] = [];
  let validatedDocument: ValidJsxNode[] = [];
  function result(operations: JsxEditOperation[] = []): ValidatedEdits {
    return { operations, errors, rawNodes: document, nodes: validatedDocument };
  }
  function report(path: string, code: GenUIError["code"], message: string) {
    if (errors.length < maxErrors) errors.push({ path, code, message });
  }
  if (options.history.length >= 1000)
    report("", "limit", "A conversation accepts at most 1000 turns.");
  let length = source.length;
  for (const turn of options.history) length += turn.length;
  if (length > maxJsxLength)
    report("", "limit", `Conversation JSX exceeds ${maxJsxLength} characters.`);
  if (errors.length) return result();

  let revisions = new Map<string, number>();
  function validate(nodes: JsxNode[]) {
    if (nodes.length > max) {
      report("", "limit", `This scope accepts at most ${max} direct children.`);
      return;
    }
    let count = 0;
    const pending = nodes.map((node) => ({ node, depth: 0 }));
    while (pending.length) {
      const { node, depth } = pending.pop()!;
      count += 1;
      if (count > maxJsxNodes || (node.kind === "element" && depth >= maxJsxDepth)) {
        report(
          node.key,
          "limit",
          `Conversation trees accept at most ${maxJsxNodes} nodes and ${maxJsxDepth} element levels.`,
        );
        return;
      }
      if (node.kind === "element") {
        for (const child of node.children) pending.push({ node: child, depth: depth + 1 });
      }
    }
    const result = validateJsx({ nodes, errors: [], complete: true }, options);
    for (const error of result.errors) report(error.path, error.code, error.message);
    if (!errors.length) return result.nodes;
    return undefined;
  }
  function turn(text: string, index: number, current: boolean): JsxEditOperation[] {
    const parsed = parsePartialJsx(text, { final: true });
    for (const error of parsed.errors) report(error.path, error.code, error.message);
    if (!parsed.complete && !errors.length)
      report("", "truncated", "An edit or history turn must be complete and nonempty.");
    if (errors.length) return [];
    let nodes = parsed.nodes;
    if (options.scope !== undefined) {
      const envelopes = nodes.filter(
        (node) => node.kind === "element" && node.name === options.scope,
      );
      if (envelopes.length === 0) return [];
      if (envelopes.length !== 1) {
        report(
          "",
          "invalid-prop",
          `The response must fill the ${options.scope} hole exactly once.`,
        );
        return [];
      }
      nodes = (envelopes[0] as JsxElement).children;
    }
    if (!nodes.length) {
      report("", "missing-prop", "A turn must contain components or edit operations.");
      return [];
    }
    const isEdit = (node: JsxNode) =>
      node.kind === "element" && (node.name === "Update" || node.name === "Append");
    const edit = nodes.some(isEdit);
    if (!edit) {
      if (current) {
        report("", "invalid-prop", "An edit turn contains only Update and Append operations.");
        return [];
      }
      let prefix = "";
      if (index > 0) prefix = `/turn/${index}`;
      const next = [...document, ...nodes.map((node) => copy(node, prefix))];
      const valid = validate(next);
      if (!valid) return [];
      document = next;
      validatedDocument = valid;
      for (const id of named(document).keys()) if (!revisions.has(id)) revisions.set(id, 0);
      return [];
    }
    if (!nodes.every(isEdit)) {
      report(
        "",
        "invalid-prop",
        "Do not mix Update or Append operations with a new component tree.",
      );
      return [];
    }
    const next = document.map((node) => copy(node));
    const nextRevisions = new Map(revisions);
    const operations: JsxEditOperation[] = [];
    let nextValidated: ValidJsxNode[] = [];
    for (const [operationIndex, node] of nodes.entries()) {
      const operation = node as JsxElement;
      let targetId = operation.props.id;
      if (operation.name === "Append") targetId = operation.props.to;
      if (!isComponentId(targetId)) {
        report(operation.key, "invalid-prop", `${operation.name} requires a simple target ID.`);
        return [];
      }
      const target = named(next).get(targetId);
      if (!target) {
        report(
          operation.key,
          "invalid-prop",
          `No mounted component has id ${JSON.stringify(targetId)}.`,
        );
        return [];
      }
      const expectedRevision = nextRevisions.get(targetId) ?? 0;
      let rawChildren: JsxNode[] = [];
      if (operation.name === "Update") {
        if (operation.children.length) {
          report(
            operation.key,
            "invalid-prop",
            "Update changes props only; it cannot contain children.",
          );
          return [];
        }
        const changed = Object.keys(operation.props).filter((key) => key !== "id");
        if (!changed.length) {
          report(operation.key, "missing-prop", "Update must supply at least one prop.");
          return [];
        }
        if (changed.includes("name") || changed.includes("bind")) {
          report(
            operation.key,
            "invalid-prop",
            "Update cannot change a component's name or binding.",
          );
          return [];
        }
        if (
          ["Option", "Tab", "TabPanel", "Section"].includes(target.name) &&
          changed.includes("value") &&
          operation.props.value !== target.props.value
        ) {
          report(
            operation.key,
            "invalid-prop",
            "Update cannot change a collection item's value identity.",
          );
          return [];
        }
        const props = { ...operation.props };
        delete props.id;
        target.props = { ...target.props, ...props };
      } else {
        if (Object.keys(operation.props).some((key) => key !== "to")) {
          report(operation.key, "unknown-prop", "Append accepts only its to attribute.");
          return [];
        }
        if (!operation.children.length) {
          report(operation.key, "missing-prop", "Append must supply at least one child.");
          return [];
        }
        rawChildren = operation.children.map((child) =>
          copy(child, `/edit/${index}/${operationIndex}`),
        );
        target.children.push(...rawChildren);
      }
      const valid = validate(next);
      if (!valid) return [];
      nextValidated = valid;
      const validated = named(valid).get(targetId) as ValidJsxElement | undefined;
      if (!validated) {
        report(operation.key, "invalid-prop", "The updated target must remain a valid component.");
        return [];
      }
      nextRevisions.set(targetId, expectedRevision + 1);
      for (const id of named(next).keys()) if (!nextRevisions.has(id)) nextRevisions.set(id, 0);
      const raw = copy(target) as JsxElement;
      if (operation.name === "Update")
        operations.push({ kind: "update", target: targetId, expectedRevision, raw, validated });
      else {
        const keys = new Set(rawChildren.map((child) => child.key));
        operations.push({
          kind: "append",
          target: targetId,
          expectedRevision,
          raw,
          validated,
          rawChildren: rawChildren.map((child) => copy(child)),
          children: validated.children.filter((child) => keys.has(child.key)),
        });
      }
    }
    document = next;
    validatedDocument = nextValidated;
    revisions = nextRevisions;
    return operations;
  }
  for (const [index, text] of options.history.entries()) {
    turn(text, index, false);
    if (errors.length) return result();
  }
  const operations = turn(source, options.history.length, true);
  if (errors.length) return result();
  return result(operations);
}
