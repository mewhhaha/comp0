import { Suspense, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { validateEdits } from "../composition/edits.js";
import { type Vocabulary } from "../composition/spec.js";
import { type StateContract } from "../composition/state.js";
import {
  expressionSource,
  resolveExpressions,
  createJsxValidation,
  validateJsx,
  type ValidJsxElement,
  type ValidJsxNode,
} from "../composition/validate.js";
import { safeImageSrc } from "../safe.js";
import { type JsxElement } from "../jsx/parse.js";
import {
  GenUIApplyEdits,
  GenUIClientNode,
  GenUIEditable,
  GenUIExpression,
  GenUIServerNode,
  GenUIStreamEnd,
  GenUIViewScope,
} from "./client.js";
import { type ComponentRegistry } from "./components.js";
import { type ClientEdit, type EditableNode } from "./edit-store.js";
import { completedResponse, type ResponseSource, type ResponseStream } from "./stream.js";

type Scope = {
  response: ResponseStream;
  vocabulary: Vocabulary;
  state: StateContract | undefined;
  components: ComponentRegistry;
  validation: ReturnType<typeof createJsxValidation>;
  version: number;
  nodeAt: (key: string) => ValidJsxNode | undefined;
  root: string;
  max: number;
  name: string;
};

function scopedParse(scope: Scope) {
  const parsed = scope.response.parsed;
  if (scope.root === "") return parsed;
  const parent = scope.response.nodeAt(scope.root);
  if (parent?.kind !== "element") return { ...parsed, nodes: [] };
  let nodes = parent.children;
  if (nodes.length > scope.max) nodes = nodes.slice(0, scope.max);
  return { ...parsed, nodes };
}

function indexNodes(children: ValidJsxNode[]) {
  const nodes = new Map<string, ValidJsxNode>();
  function collect(children: ValidJsxNode[]) {
    for (const node of children) {
      nodes.set(node.key, node);
      if (node.kind === "element") collect(node.children);
    }
  }
  collect(children);
  return nodes;
}

function validated(scope: Scope, path: string) {
  if (scope.version !== scope.response.version) {
    scope.validation.read(scopedParse(scope));
    scope.version = scope.response.version;
  }
  return scope.nodeAt(path);
}

function editableNode(node: ValidJsxElement, source: JsxElement): EditableNode {
  const inputs = { ...node.props };
  for (const key of Object.keys(inputs)) {
    if (Object.hasOwn(source.props, key)) inputs[key] = source.props[key]!;
  }
  let text: EditableNode["text"];
  if (
    node.entry.children === "label" &&
    !node.children.some((child) => child.kind === "text" && child.text.trim() !== "")
  ) {
    text = node.children.flatMap((child): (string | { $expr: string })[] => {
      if (child.kind === "text") return [child.text];
      if (child.kind === "expression") return [{ $expr: child.source }];
      return [];
    });
  }
  return { id: node.id!, name: node.name, props: node.props, inputs, binding: node.binding, text };
}

async function GrowingText({
  scope,
  path,
  from = 0,
}: {
  scope: Scope;
  path: string;
  from?: number;
}) {
  const { response } = scope;
  await response.until(() => {
    const node = response.nodeAt(path);
    return node?.kind !== "text" || node.closed || node.text.length > from;
  });
  const node = response.nodeAt(path);
  if (node?.kind !== "text") return null;
  const piece = node.text.slice(from);
  if (node.closed || response.done) return piece;
  return (
    <>
      {piece}
      <Suspense fallback={null}>
        <GrowingText scope={scope} path={path} from={node.text.length} />
      </Suspense>
    </>
  );
}

/** Children stream uniformly for every component, including host-defined containers. */
async function Children({
  scope,
  parent = "",
  index = 0,
}: {
  scope: Scope;
  parent?: string;
  index?: number;
}) {
  const { response } = scope;
  const list = () => {
    if (parent === "") return response.parsed.nodes;
    const node = response.nodeAt(parent);
    if (node?.kind === "element") {
      if (parent === scope.root && index >= scope.max) return [];
      return node.children;
    }
    return [];
  };
  await response.until(
    () => list()[index] !== undefined || response.nodeAt(parent)?.closed === true,
  );
  const child = list()[index];
  if (!child) return null;
  return (
    <>
      <Suspense key={child.key} fallback={null}>
        <NodeAt scope={scope} path={child.key} />
      </Suspense>
      <Suspense fallback={null}>
        <Children scope={scope} parent={parent} index={index + 1} />
      </Suspense>
    </>
  );
}

function renderStaticNode({
  node,
  children,
}: {
  node: ValidJsxElement;
  children: ReactNode;
}): ReactNode | undefined {
  const props = node.props;
  if (node.name === "Stack") {
    return (
      <div
        data-comp0="stack"
        data-direction={props.direction}
        data-gap={props.gap}
        data-align={props.align}
        data-wrap={dataAttr(props.wrap === true)}
      >
        {children}
      </div>
    );
  }
  if (node.name === "Grid")
    return (
      <div data-comp0="grid" data-columns={props.columns} data-gap={props.gap}>
        {children}
      </div>
    );
  if (node.name === "Heading") {
    let level = 2;
    if (typeof props.level === "number") level = Math.min(6, Math.max(1, Math.round(props.level)));
    const Heading = `h${level}` as "h2";
    return <Heading data-comp0="heading">{children}</Heading>;
  }
  if (node.name === "Text")
    return (
      <p data-comp0="text" data-tone={props.tone} data-size={props.size}>
        {children}
      </p>
    );
  if (node.name === "List") {
    if (props.ordered === true) return <ol data-comp0="list">{children}</ol>;
    return <ul data-comp0="list">{children}</ul>;
  }
  if (node.name === "Item") return <li>{children}</li>;
  if (node.name === "Image") {
    const src = safeImageSrc(props.src);
    if (!src) return null;
    return (
      <figure data-comp0="image">
        <img
          src={src}
          alt={String(props.alt)}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {typeof props.caption === "string" && <figcaption>{props.caption}</figcaption>}
      </figure>
    );
  }
  return undefined;
}

async function NodeAt({ scope, path }: { scope: Scope; path: string }) {
  const { response } = scope;
  await response.until(
    () => validated(scope, path) !== undefined || response.nodeAt(path)?.closed === true,
  );
  const node = validated(scope, path);
  if (!node) return null;
  if (node.kind === "text") return <GrowingText scope={scope} path={path} />;
  if (node.kind === "expression") return <GenUIExpression source={node.source} />;
  const children = (
    <Suspense fallback={null}>
      <Children scope={scope} parent={path} />
    </Suspense>
  );
  const implementation = scope.components.get(node.entry);
  const source = response.nodeAt(path) as JsxElement;
  const metadata = editableNode(node, source);
  if (implementation && "render" in implementation) {
    // The endpoint validates inputs itself. Retain their original representation so schema
    // transforms run once, both for the initial render and subsequent refresh requests.
    const inputs = metadata.inputs;
    const props = resolveExpressions(inputs, scope.state?.initial ?? {});
    let content: ReactNode;
    try {
      content = await scope.components.render(node.name, props);
    } catch {
      content = <output>This view could not be loaded.</output>;
    }
    if (node.id) {
      return (
        <GenUIEditable scope={scope.name} node={metadata} initialProps={props}>
          {content}
        </GenUIEditable>
      );
    }
    if (!Object.values(node.props).some((value) => expressionSource(value) !== undefined))
      return content;
    return (
      <GenUIServerNode name={node.name} props={inputs} initialProps={props}>
        {content}
      </GenUIServerNode>
    );
  }
  if (node.id) {
    return (
      <GenUIEditable scope={scope.name} node={metadata} component={implementation?.component}>
        {children}
      </GenUIEditable>
    );
  }
  if (
    implementation === undefined &&
    metadata.text === undefined &&
    !Object.values(node.props).some((value) => expressionSource(value) !== undefined)
  ) {
    const result = renderStaticNode({ node, children });
    if (result !== undefined) return result;
  }
  return (
    <GenUIClientNode
      name={node.name}
      component={implementation?.component}
      props={node.props}
      binding={node.binding}
      text={metadata.text}
    >
      {children}
    </GenUIClientNode>
  );
}

async function StreamEnd({ scope }: { scope: Scope }) {
  await scope.response.until(() => false);
  const { errors } = validateJsx(scopedParse(scope), {
    vocabulary: scope.vocabulary,
    state: scope.state,
  });
  const parent = scope.response.nodeAt(scope.root);
  if (parent?.kind === "element" && parent.children.length > scope.max) {
    errors.push({
      path: scope.root,
      code: "limit",
      message: `This hole accepts at most ${scope.max} children.`,
    });
  }
  if (parent?.kind === "element") {
    for (const duplicate of scope.response.parsed.nodes.filter(
      (node) => node.kind === "element" && node.name === parent.name && node.key !== parent.key,
    )) {
      errors.push({
        path: duplicate.key,
        code: "invalid-prop",
        message: `Write the ${parent.name} hole exactly once.`,
      });
    }
  }
  return <GenUIStreamEnd errors={errors} />;
}

export type GenUIViewProps = {
  /** A complete JSX response or text deltas from the model. */
  source: ResponseSource;
  /** Marks an edit turn. Complete accepted JSX turns validate targets and their revisions. */
  history?: readonly string[];
  /** A unique host-owned message ID. Required for Update/Append and reused on retries. */
  turn?: string;
};

/** Shared by a whole response and independently constrained holes in a host layout. */
export function ResponseView({
  response,
  vocabulary,
  state,
  components,
  root = "",
  max = Infinity,
  history,
  turn,
  name = "",
}: {
  response: ResponseStream;
  vocabulary: Vocabulary;
  state: StateContract | undefined;
  components: ComponentRegistry;
  root?: string;
  max?: number;
  history?: readonly string[] | undefined;
  turn?: string | undefined;
  name?: string;
}) {
  const validation = createJsxValidation({ vocabulary, state, complete: false }, root);
  const scope: Scope = {
    validation,
    response,
    vocabulary,
    state,
    components,
    version: -1,
    nodeAt: validation.nodeAt,
    root,
    max,
    name,
  };
  return (
    <GenUIViewScope>
      <Suspense fallback={null}>
        <ResponseContent scope={scope} history={history} turn={turn} />
      </Suspense>
    </GenUIViewScope>
  );
}

async function ResponseContent({
  scope,
  history,
  turn,
}: {
  scope: Scope;
  history: readonly string[] | undefined;
  turn: string | undefined;
}) {
  const { response } = scope;
  await response.until(() => scopedParse(scope).nodes.length > 0);
  const first = scopedParse(scope).nodes[0];
  if (
    history === undefined &&
    (first?.kind !== "element" || (first.name !== "Update" && first.name !== "Append"))
  ) {
    return (
      <>
        <Suspense fallback={null}>
          <Children scope={scope} parent={scope.root} />
        </Suspense>
        <Suspense fallback={null}>
          <StreamEnd scope={scope} />
        </Suspense>
      </>
    );
  }
  await response.until(() => false);
  const result = validateEdits(response.source, {
    history: history ?? [],
    vocabulary: scope.vocabulary,
    state: scope.state,
    scope: scope.name || undefined,
    max: Math.min(scope.max, 1000),
  });
  const errors = [...response.parsed.errors, ...result.errors];
  if (!turn?.trim() || turn.length > 200) {
    errors.push({
      path: "",
      code: "missing-prop",
      message: "An edit turn needs a unique host turn ID of 1 to 200 characters.",
    });
  }
  const operations: ClientEdit[] = [];
  if (errors.length === 0) {
    for (const operation of result.operations) {
      const node = editableNode(operation.validated, operation.raw);
      const base = { target: operation.target, expectedRevision: operation.expectedRevision, node };
      if (operation.kind === "update") {
        operations.push({ ...base, kind: "update" });
        continue;
      }
      // Appended text names replace the complete text value; other children keep their fibers.
      if (operation.validated.entry.children === "label") {
        node.text = operation.validated.children.flatMap(
          (child): (string | { $expr: string })[] => {
            if (child.kind === "text") return [child.text];
            if (child.kind === "expression") return [{ $expr: child.source }];
            return [];
          },
        );
      }
      const response = completedResponse(operation.rawChildren);
      const nodes = indexNodes(operation.children);
      const appended: Scope = {
        ...scope,
        response,
        nodeAt: (key) => nodes.get(key),
        version: response.version,
        root: "",
        max: Infinity,
      };
      const targets: EditableNode[] = [];
      for (const child of nodes.values()) {
        if (child.kind === "element" && child.id)
          targets.push(editableNode(child, response.nodeAt(child.key) as JsxElement));
      }
      operations.push({
        ...base,
        kind: "append",
        targets,
        children: (
          <Suspense key={operation.rawChildren[0]!.key} fallback={null}>
            <Children scope={appended} />
          </Suspense>
        ),
      });
    }
  }
  return (
    <GenUIApplyEdits turn={turn ?? ""} scope={scope.name} operations={operations} errors={errors} />
  );
}
