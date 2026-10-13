import { Suspense, type ComponentType, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { builtInVocabulary } from "../composition/builtins.js";
import { validateEdits } from "../composition/edits.js";
import { type Vocabulary } from "../composition/spec.js";
import { type StateContract } from "../composition/state.js";
import {
  expressionSource,
  needsTextName,
  resolveExpressions,
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
import { isServerComponent, renderComponent, type ComponentImplementations } from "./components.js";
import { type ClientEdit, type EditableNode } from "./edit-store.js";
import { completedResponse, readResponse, type ResponseStream } from "./stream.js";

type Scope = {
  response: ResponseStream;
  vocabulary: Vocabulary;
  state: StateContract | undefined;
  components: ComponentImplementations;
  version: number;
  nodes: Map<string, ValidJsxNode>;
  root: string;
  max: number;
  name: string;
};

function scopedParse(scope: Scope) {
  const parsed = scope.response.parsed;
  if (scope.root === "") return parsed;
  const parent = scope.response.nodeAt(scope.root);
  if (parent?.kind !== "element") return { ...parsed, nodes: [] };
  return { ...parsed, nodes: parent.children.slice(0, scope.max) };
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

function validated(scope: Scope) {
  if (scope.version === scope.response.version) return scope.nodes;
  const result = validateJsx(scopedParse(scope), {
    vocabulary: scope.vocabulary,
    state: scope.state,
    complete: false,
  });
  const nodes = indexNodes(result.nodes);
  scope.version = scope.response.version;
  scope.nodes = nodes;
  return nodes;
}

function editableNode(node: ValidJsxElement, source: JsxElement): EditableNode {
  const inputs = { ...node.props };
  for (const key of Object.keys(inputs)) {
    if (Object.hasOwn(source.props, key)) inputs[key] = source.props[key]!;
  }
  let text: EditableNode["text"];
  if (
    needsTextName(node.name) &&
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
      if (parent === scope.root) return node.children.slice(0, scope.max);
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
        data-slot="stack"
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
      <div data-slot="grid" data-columns={props.columns} data-gap={props.gap}>
        {children}
      </div>
    );
  if (node.name === "Heading") {
    let level = 2;
    if (typeof props.level === "number") level = Math.min(6, Math.max(1, Math.round(props.level)));
    const Heading = `h${level}` as "h2";
    return <Heading data-slot="heading">{children}</Heading>;
  }
  if (node.name === "Text")
    return (
      <p data-slot="text" data-tone={props.tone} data-size={props.size}>
        {children}
      </p>
    );
  if (node.name === "List") {
    if (props.ordered === true) return <ol data-slot="list">{children}</ol>;
    return <ul data-slot="list">{children}</ul>;
  }
  if (node.name === "Item") return <li>{children}</li>;
  if (node.name === "Image") {
    const src = safeImageSrc(props.src);
    if (!src) return null;
    return (
      <figure data-slot="image">
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
  await response.until(() => validated(scope).has(path) || response.nodeAt(path)?.closed === true);
  const node = validated(scope).get(path);
  if (!node) return null;
  if (node.kind === "text") return <GrowingText scope={scope} path={path} />;
  if (node.kind === "expression") return <GenUIExpression source={node.source} />;
  const children = (
    <Suspense fallback={null}>
      <Children scope={scope} parent={path} />
    </Suspense>
  );
  let implementation = Object.getOwnPropertyDescriptor(scope.components, node.name)
    ?.value as unknown;
  if (implementation === undefined && "component" in node.entry)
    implementation = node.entry.component;
  const source = response.nodeAt(path) as JsxElement;
  const metadata = editableNode(node, source);
  if (isServerComponent(implementation)) {
    // The endpoint validates inputs itself. Retain their original representation so schema
    // transforms run once, both for the initial render and subsequent refresh requests.
    const inputs = metadata.inputs;
    const props = resolveExpressions(inputs, scope.state?.initial ?? {});
    let content: ReactNode;
    try {
      content = await renderComponent(scope.components, node.name, props);
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
      <GenUIEditable
        scope={scope.name}
        node={metadata}
        component={implementation as ComponentType<never> | undefined}
      >
        {children}
      </GenUIEditable>
    );
  }
  if (
    needsTextName(node.name) &&
    !node.children.some((child) => child.kind === "text" && child.text.trim() !== "")
  ) {
    const text: (string | { $expr: string })[] = [];
    for (const child of node.children) {
      if (child.kind === "text") text.push(child.text);
      if (child.kind === "expression") text.push({ $expr: child.source });
    }
    return (
      <GenUIClientNode
        name={node.name}
        component={implementation as ComponentType<never> | undefined}
        props={node.props}
        text={text}
      />
    );
  }
  if (
    implementation === undefined &&
    !Object.values(node.props).some((value) => expressionSource(value) !== undefined)
  ) {
    const result = renderStaticNode({ node, children });
    if (result !== undefined) return result;
  }
  return (
    <GenUIClientNode
      name={node.name}
      component={implementation as ComponentType<never> | undefined}
      props={node.props}
      binding={node.binding}
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
  /** Restricted JSX text deltas from the model. */
  stream: AsyncIterable<string>;
  vocabulary?: Vocabulary;
  state?: StateContract;
  components?: ComponentImplementations;
  /** Marks an edit turn. Complete accepted JSX turns validate targets and their revisions. */
  history?: readonly string[];
  /** A unique host-owned message ID. Required for Update/Append and reused on retries. */
  turn?: string;
};

/** Renders one model response. Opening tags settle props; every child streams in its own boundary. */
export function GenUIView({
  stream,
  vocabulary = builtInVocabulary,
  state,
  components = {},
  history,
  turn,
}: GenUIViewProps) {
  return (
    <ResponseView
      response={readResponse(stream)}
      vocabulary={vocabulary}
      state={state}
      components={components}
      history={history}
      turn={turn}
    />
  );
}

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
  components: ComponentImplementations;
  root?: string;
  max?: number;
  history?: readonly string[] | undefined;
  turn?: string | undefined;
  name?: string;
}) {
  const scope: Scope = {
    response,
    vocabulary,
    state,
    components,
    version: -1,
    nodes: new Map(),
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
      if (needsTextName(node.name)) {
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
        nodes,
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
