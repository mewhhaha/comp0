"use client";

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BusyRegion } from "@comp0/react";
import { catalog } from "../catalog/catalog.js";
import { type JsonValue } from "../json/parse.js";
import { GenUIContext, type GenUIAction } from "../render/context.js";
import { resolveProps } from "../render/node.js";
import { createGenUIStore, type GenUIState, type GenUIStore } from "../state/store.js";
import { toolCaller } from "../tools/http.js";
import { type ToolCaller } from "../tools/tools.js";
import { validateResponse } from "../validate/validate.js";

/*
 * The client half of server-streamed GenUI. A root is the shared scope: one store, the host's
 * views and tools, and where actions go. Any number of views stream into it from the server,
 * such as one per turn of a conversation, and the host's own components anywhere inside it read
 * and write the same values.
 */

type Root = {
  store: GenUIStore;
  slots: Readonly<Record<string, ReactNode>>;
  call: ToolCaller | undefined;
  act: (action: GenUIAction) => void;
};

const RootContext = createContext<Root | null>(null);

function useRoot(): Root {
  const root = use(RootContext);
  if (root === null) throw new Error("GenUI views and hooks must render inside <GenUIRoot>.");
  return root;
}

const noSlots: Readonly<Record<string, ReactNode>> = {};

export type GenUIRootProps = {
  children?: ReactNode;
  /** Host views the model can place by name with `{ "type": "Slot", "name": ... }`. */
  slots?: Readonly<Record<string, ReactNode>> | undefined;
  /**
   * Runs a tool for Query nodes and `call` steps: the URL of an endpoint served by
   * `handleToolRequest`, or a function. Prefer a URL in React Router: its server functions
   * re-render the route after every call.
   */
  call?: ToolCaller | string | undefined;
  /** A button, form, or suggestion asked the assistant something; a server function works. */
  onAction?: ((action: GenUIAction) => void | Promise<void>) | undefined;
  /** Values to start with, such as a saved state. */
  initialState?: Readonly<Record<string, JsonValue>> | undefined;
  /** A store kept outside, to share values beyond this root. */
  store?: GenUIStore | undefined;
};

/** The shared scope of server-streamed GenUI views. Renders no element. */
export function GenUIRoot({
  children,
  slots = noSlots,
  call,
  onAction,
  initialState,
  store: provided,
}: GenUIRootProps) {
  const [own] = useState(() => createGenUIStore(initialState));
  // Semantic identity: queries rerun when the caller changes, so a URL keeps one caller.
  const caller = useMemo(() => toolCaller(call), [call]);
  const root: Root = {
    store: provided ?? own,
    slots,
    call: caller,
    act: (action) => void onAction?.(action),
  };
  return <RootContext value={root}>{children}</RootContext>;
}

type View = { streaming: boolean; setStreaming: (streaming: boolean) => void };

const ViewContext = createContext<View | null>(null);

function useView(): View {
  const view = use(ViewContext);
  if (view === null) throw new Error("A GenUI node must render inside a <GenUIView>.");
  return view;
}

/** The client side of one streamed view: whether its response is still arriving. */
export function GenUIViewScope({ children }: { children?: ReactNode }) {
  const [streaming, setStreaming] = useState(true);
  return (
    <ViewContext value={{ streaming, setStreaming }}>
      <BusyRegion busy={streaming} data-slot="genui-view">
        {children}
      </BusyRegion>
    </ViewContext>
  );
}

export type GenUIClientNodeProps = {
  /** The component as the model wrote it, finished. Slots the server renders are left empty. */
  node: JsonValue;
  /** Every binding the response declared so far, with its initial value. */
  bindings: Record<string, JsonValue>;
  /** Nested components the server rendered, for a container such as a Form. */
  children?: ReactNode;
};

/** One interactive component: validated on the client and rendered with its built-in facade. */
export function GenUIClientNode({ node, bindings, children }: GenUIClientNodeProps) {
  const root = useRoot();
  const view = useView();
  const validated = validateResponse(node, { catalog });
  if (validated.root === undefined) return null;
  const context = {
    store: root.store,
    streaming: view.streaming,
    bindings: new Map(Object.entries(bindings)),
    call: root.call,
    slots: root.slots,
    // Acting on a half-written interface would send a half-written request.
    act: (action: GenUIAction) => {
      if (!view.streaming) root.act(action);
    },
  };
  const Facade = validated.root.entry.component;
  const props = resolveProps(validated.root.props);
  if (children !== undefined) props.children = children;
  return (
    <GenUIContext value={context}>
      <Facade {...props} />
    </GenUIContext>
  );
}

/** Rendered by the server once the model has finished; ends the view's streaming state. */
export function GenUIStreamEnd() {
  const { setStreaming } = useView();
  useEffect(() => setStreaming(false), [setStreaming]);
  return null;
}

/** The store every view in the root shares, for host components that write values too. */
export function useGenUIStore(): GenUIStore {
  return useRoot().store;
}

/**
 * The live value of a name, for host components such as a canvas the model's controls drive. It
 * updates as the person moves a control, with no server round trip.
 */
export function useGenUIValue(name: string): JsonValue | undefined {
  const { store } = useRoot();
  return useSyncExternalStore(
    store.subscribe,
    () => store.get(name),
    () => store.get(name),
  );
}

/** Every stored value, for host components that react to the whole state. */
export function useGenUIState(): GenUIState {
  const { store } = useRoot();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** The root's tool caller, for host components that call the same tools as the model. */
export function useGenUICall(): ToolCaller | undefined {
  return useRoot().call;
}
