import { Suspense, type ReactNode } from "react";
import { type JsonValue } from "../json/parse.js";
import { aligns, gaps, tones } from "../facades/tokens.js";
import { asNumber, asToken, safeImageSrc } from "../safe.js";
import { validateResponse } from "../validate/validate.js";
import { Binding, Computed, ValidNode } from "../validate/values.js";
import {
  GenUIAccordionItem,
  GenUIAccordionRoot,
  GenUIClientNode,
  GenUIStreamEnd,
  GenUITab,
  GenUITabPanel,
  GenUITabsRoot,
  GenUIViewScope,
} from "./client.js";
import { readResponse, type ResponseStream } from "./stream.js";

/*
 * Renders a model's response as React Server Components while it streams. The model composes
 * layout; layout renders here as plain HTML and ships no JavaScript, and every interactive part
 * is a predefined client component. Each node waits in its own Suspense boundary until enough of
 * it has arrived, so the page streams top-down and nothing already sent is replaced.
 */

type Scope = {
  response: ResponseStream;
  /** Makes ids unique per view. */
  id: string;
};

type Validated = {
  version: number;
  nodes: Map<string, ValidNode>;
  bindings: Record<string, JsonValue>;
};

const validations = new WeakMap<ResponseStream, Validated>();

function collect(value: unknown, nodes: Map<string, ValidNode>) {
  if (value instanceof ValidNode) {
    nodes.set(value.key, value);
    for (const prop of Object.values(value.props)) collect(prop, nodes);
  } else if (Array.isArray(value)) {
    for (const item of value) collect(item, nodes);
  } else if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) collect(item, nodes);
  }
}

/** The response validated against the server catalog, once per state of the stream. */
function validated(response: ResponseStream): Validated {
  const cached = validations.get(response);
  if (cached?.version === response.version) return cached;
  const result = validateResponse(response.parsed, { complete: response.done });
  const nodes = new Map<string, ValidNode>();
  collect(result.root, nodes);
  const bindings: Record<string, JsonValue> = {};
  for (const [name, initial] of result.bindings)
    if (initial !== undefined) bindings[name] = initial;
  const next = { version: response.version, nodes, bindings };
  validations.set(response, next);
  return next;
}

/** The pointer of the object or array that holds `pointer`. */
function parentOf(pointer: string) {
  return pointer.slice(0, pointer.lastIndexOf("/"));
}

/**
 * Whether a value that is not written yet never will be: its container has closed. A key the
 * model has not reached is not the same as an empty one.
 */
function missingForGood(response: ResponseStream, pointer: string) {
  return response.valueAt(pointer) === undefined && !response.isOpen(parentOf(pointer));
}

function clampLevel(level: number) {
  return Math.min(6, Math.max(1, level));
}

/** A string prop that grows while the model writes it: each new piece streams in its own boundary. */
async function GrowingText({
  response,
  path,
  from = 0,
}: {
  response: ResponseStream;
  path: string;
  from?: number;
}) {
  await response.until(() => {
    const value = response.valueAt(path);
    if (value === undefined) return missingForGood(response, path);
    return (typeof value === "string" && value.length > from) || !response.isOpen(path);
  });
  const value = response.valueAt(path);
  const text = typeof value === "string" ? value : "";
  const piece = text.slice(from);
  if (!response.isOpen(path)) return piece;
  return (
    <>
      {piece}
      <Suspense fallback={null}>
        <GrowingText response={response} path={path} from={text.length} />
      </Suspense>
    </>
  );
}

/** The items of an array prop from `index` on, each rendered as soon as it starts. */
async function ItemsFrom({
  response,
  path,
  index,
  render,
}: {
  response: ResponseStream;
  path: string;
  index: number;
  render: (itemPath: string) => ReactNode;
}) {
  const itemPath = `${path}/${index}`;
  await response.until(() => {
    if (response.valueAt(itemPath) !== undefined) return true;
    // The array itself may not have started yet.
    if (response.valueAt(path) === undefined) return missingForGood(response, path);
    return !response.isOpen(path);
  });
  if (response.valueAt(itemPath) === undefined) return null;
  return (
    <>
      {render(itemPath)}
      <Suspense fallback={null}>
        <ItemsFrom response={response} path={path} index={index + 1} render={render} />
      </Suspense>
    </>
  );
}

function Children({ scope, path, level }: { scope: Scope; path: string; level: number }) {
  return (
    <Suspense fallback={null}>
      <ItemsFrom
        response={scope.response}
        path={`${path}/children`}
        index={0}
        render={(itemPath) => (
          <Suspense key={itemPath} fallback={null}>
            <NodeAt scope={scope} path={itemPath} level={level} />
          </Suspense>
        )}
      />
    </Suspense>
  );
}

function itemIndex(itemPath: string) {
  return itemPath.slice(itemPath.lastIndexOf("/") + 1);
}

/** One accordion section, once its `open` flag is written; title and content stream in it. */
async function AccordionItemAt({
  scope,
  path,
  level,
}: {
  scope: Scope;
  path: string;
  level: number;
}) {
  const { response } = scope;
  await response.until(() => settled(response, path, ["title", "children"]));
  return (
    <GenUIAccordionItem
      value={`item-${itemIndex(path)}`}
      level={clampLevel(level) as 1 | 2 | 3 | 4 | 5 | 6}
      open={response.valueAt(`${path}/open`) === true}
      title={<GrowingText response={response} path={`${path}/title`} />}
    >
      <Children scope={scope} path={path} level={level + 1} />
    </GenUIAccordionItem>
  );
}

type ServerRenderer = (input: { scope: Scope; node: ValidNode; level: number }) => ReactNode;

const serverRenderers: Record<string, ServerRenderer> = {
  Stack: ({ scope, node, level }) => (
    <div
      data-slot="stack"
      data-direction={asToken(node.props.direction, ["column", "row"] as const)}
      data-gap={asToken(node.props.gap, gaps)}
      data-align={asToken(node.props.align, aligns)}
      data-wrap={node.props.wrap === true ? "" : undefined}
    >
      <Children scope={scope} path={node.key} level={level} />
    </div>
  ),
  Grid: ({ scope, node, level }) => {
    const columns = asNumber(node.props.columns);
    return (
      <div
        data-slot="grid"
        data-columns={
          columns === undefined ? undefined : Math.min(6, Math.max(1, Math.round(columns)))
        }
        data-gap={asToken(node.props.gap, gaps)}
      >
        <Children scope={scope} path={node.key} level={level} />
      </div>
    );
  },
  Card: ({ scope, node, level }) => {
    const headingId = `genui-${scope.id}-${node.key.replaceAll("/", "-")}`;
    let description: ReactNode = null;
    if (typeof node.props.description === "string") {
      description = (
        <p data-slot="card-description">
          <GrowingText response={scope.response} path={`${node.key}/description`} />
        </p>
      );
    }
    const Title = `h${clampLevel(level)}` as "h2";
    return (
      <section
        data-slot="card"
        data-tone={asToken(node.props.tone, ["default", "muted", "accent"] as const)}
        aria-labelledby={headingId}
      >
        <Title id={headingId} data-slot="card-title">
          <GrowingText response={scope.response} path={`${node.key}/title`} />
        </Title>
        {description}
        <Children scope={scope} path={node.key} level={level + 1} />
      </section>
    );
  },
  Heading: ({ scope, node }) => {
    const level = asNumber(node.props.level);
    const Heading = `h${clampLevel(level === undefined ? 2 : Math.round(level))}` as "h2";
    return (
      <Heading data-slot="heading">
        <GrowingText response={scope.response} path={`${node.key}/text`} />
      </Heading>
    );
  },
  Text: ({ scope, node }) => (
    <p
      data-slot="text"
      data-tone={asToken(node.props.tone, tones)}
      data-size={asToken(node.props.size, ["sm", "md", "lg"] as const)}
    >
      <GrowingText response={scope.response} path={`${node.key}/text`} />
    </p>
  ),
  List: ({ scope, node }) => {
    const items = (
      <ItemsFrom
        response={scope.response}
        path={`${node.key}/items`}
        index={0}
        render={(itemPath) => (
          <li key={itemPath}>
            <GrowingText response={scope.response} path={itemPath} />
          </li>
        )}
      />
    );
    if (node.props.ordered === true) return <ol data-slot="list">{items}</ol>;
    return <ul data-slot="list">{items}</ul>;
  },
  Tabs: ({ scope, node, level }) => {
    const tabs = `${node.key}/tabs`;
    return (
      <GenUITabsRoot
        label={typeof node.props.label === "string" ? node.props.label : undefined}
        triggers={
          <ItemsFrom
            response={scope.response}
            path={tabs}
            index={0}
            render={(itemPath) => (
              <GenUITab key={itemPath} value={`tab-${itemIndex(itemPath)}`}>
                <GrowingText response={scope.response} path={`${itemPath}/label`} />
              </GenUITab>
            )}
          />
        }
      >
        <ItemsFrom
          response={scope.response}
          path={tabs}
          index={0}
          render={(itemPath) => (
            <GenUITabPanel key={itemPath} value={`tab-${itemIndex(itemPath)}`}>
              <Children scope={scope} path={itemPath} level={level} />
            </GenUITabPanel>
          )}
        />
      </GenUITabsRoot>
    );
  },
  Accordion: ({ scope, node, level }) => (
    <GenUIAccordionRoot multiple={node.props.multiple === true}>
      <ItemsFrom
        response={scope.response}
        path={`${node.key}/items`}
        index={0}
        render={(itemPath) => (
          <Suspense key={itemPath} fallback={null}>
            <AccordionItemAt scope={scope} path={itemPath} level={level} />
          </Suspense>
        )}
      />
    </GenUIAccordionRoot>
  ),
  Image: ({ node }) => {
    const src = safeImageSrc(node.props.src);
    if (src === undefined) return null;
    const caption = typeof node.props.caption === "string" ? node.props.caption : "";
    return (
      <figure data-slot="image">
        <img
          src={src}
          alt={typeof node.props.alt === "string" ? node.props.alt : ""}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {caption === "" ? null : <figcaption>{caption}</figcaption>}
      </figure>
    );
  },
};

/**
 * The props each server renderer streams in place (text, children, list items). Every other prop
 * must be finished before the node renders: a node renders once, so a half-written slot name or
 * token would be final.
 */
const streamedKeys: Record<string, readonly string[]> = {
  Stack: ["children"],
  Grid: ["children"],
  Card: ["title", "description", "children"],
  Heading: ["text"],
  Text: ["text"],
  List: ["items"],
  Image: [],
  Tabs: ["tabs"],
  Accordion: ["items"],
};

/** Whether every prop of the node that does not stream in place has been written in full. */
function settled(response: ResponseStream, path: string, streamed: readonly string[]) {
  if (!response.isOpen(path)) return true;
  const value = response.valueAt(path);
  const keys = typeof value === "object" && value !== null ? Object.keys(value) : [];
  return keys.every((key) => streamed.includes(key) || !response.isOpen(`${path}/${key}`));
}

/** Whether the node renders on the server; bound and computed values live in the client store. */
function rendersOnServer(node: ValidNode) {
  if (!Object.hasOwn(serverRenderers, node.entry.name)) return false;
  return !Object.values(node.props).some(
    (value) => value instanceof Binding || value instanceof Computed,
  );
}

/** Waits for the props an interactive component needs, then hands it to the client. */
async function ClientNodeAt({ scope, path, level }: { scope: Scope; path: string; level: number }) {
  const { response } = scope;
  const hasChildren = () => Array.isArray(response.valueAt(`${path}/children`));
  // A container streams its children through the server; everything else arrives whole.
  await response.until(() => {
    if (!response.isOpen(path)) return true;
    if (!hasChildren()) return false;
    const value = response.valueAt(path);
    const keys = typeof value === "object" && value !== null ? Object.keys(value) : [];
    return keys.every((key) => key === "children" || !response.isOpen(`${path}/${key}`));
  });
  const value = response.valueAt(path);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { bindings } = validated(response);
  if (!hasChildren()) return <GenUIClientNode node={value} bindings={bindings} />;
  return (
    <GenUIClientNode node={{ ...value, children: [] }} bindings={bindings}>
      <Children scope={scope} path={path} level={level} />
    </GenUIClientNode>
  );
}

/** One node of the response, once its type and required props have arrived. */
async function NodeAt({ scope, path, level }: { scope: Scope; path: string; level: number }) {
  const { response } = scope;
  await response.until(() => validated(response).nodes.has(path));
  const first = validated(response).nodes.get(path);
  if (first === undefined) return null;
  if (rendersOnServer(first)) {
    const name = first.entry.name;
    await response.until(() => settled(response, path, streamedKeys[name] ?? []));
    const node = validated(response).nodes.get(path) ?? first;
    return serverRenderers[name]!({ scope, node, level });
  }
  return <ClientNodeAt scope={scope} path={path} level={level} />;
}

async function StreamEnd({ response }: { response: ResponseStream }) {
  await response.until(() => false);
  return <GenUIStreamEnd />;
}

export type GenUIViewProps = {
  /** The model's response as it streams, such as the text deltas of a chat completion. */
  stream: AsyncIterable<string>;
};

/**
 * Streams one model response as React Server Components, inside a `<GenUIRoot>`: layout renders
 * on the server and interactive parts are the built-in client components. A root holds any
 * number of views, which share its values, tools, and host views.
 */
export function GenUIView({ stream }: GenUIViewProps) {
  const response = readResponse(stream);
  const scope: Scope = { response, id: crypto.randomUUID().slice(0, 8) };
  return (
    <GenUIViewScope>
      <Suspense fallback={null}>
        <NodeAt scope={scope} path="" level={2} />
      </Suspense>
      <Suspense fallback={null}>
        <StreamEnd response={response} />
      </Suspense>
    </GenUIViewScope>
  );
}
