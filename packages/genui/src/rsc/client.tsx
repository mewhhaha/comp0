"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BusyRegion } from "@comp0/react";
import { catalog } from "../catalog/catalog.js";
import { type JsonValue } from "../json/parse.js";
import { GenUIContext, type GenUIAction } from "../render/context.js";
import { resolveProps } from "../render/node.js";
import { createGenUIStore, type GenUIStore } from "../state/store.js";
import { validateResponse } from "../validate/validate.js";

/*
 * The client half of a server-streamed surface. The server renders the layout and streams it;
 * these predefined client components hold what must live in the browser: the store bound
 * controls share, the streaming state, and the interactive components themselves.
 */

type SurfaceRoot = {
  store: GenUIStore;
  streaming: boolean;
  act: (action: GenUIAction) => void;
  setStreaming: (streaming: boolean) => void;
};

const SurfaceRootContext = createContext<SurfaceRoot | null>(null);

function useSurfaceRoot(): SurfaceRoot {
  const root = use(SurfaceRootContext);
  if (root === null) throw new Error("A GenUI client part must render inside <GenUISurface>.");
  return root;
}

export type GenUIClientRootProps = {
  children?: ReactNode;
  /** Called when a button, form, or suggestion acts; a server function works. */
  onAction?: ((action: GenUIAction) => void | Promise<void>) | undefined;
};

/** Holds the store and streaming state of one surface; the server renders it around the layout. */
export function GenUIClientRoot({ children, onAction }: GenUIClientRootProps) {
  const [store] = useState(() => createGenUIStore());
  const [streaming, setStreaming] = useState(true);
  const root: SurfaceRoot = {
    store,
    streaming,
    setStreaming,
    act: (action) => {
      // Acting on a half-written interface would send a half-written request.
      if (!streaming) void onAction?.(action);
    },
  };
  return (
    <SurfaceRootContext value={root}>
      <BusyRegion busy={streaming} data-slot="genui-surface">
        {children}
      </BusyRegion>
    </SurfaceRootContext>
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
  const root = useSurfaceRoot();
  const validated = validateResponse(node, { catalog });
  if (validated.root === undefined) return null;
  const context = {
    store: root.store,
    streaming: root.streaming,
    bindings: new Map(Object.entries(bindings)),
    act: root.act,
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

/** Rendered by the server once the model has finished; ends the surface's streaming state. */
export function GenUIStreamEnd() {
  const { setStreaming } = useSurfaceRoot();
  useEffect(() => setStreaming(false), [setStreaming]);
  return null;
}

/**
 * The live value of a bound name, for host components such as a canvas that the model's
 * controls drive. It updates as the person moves a control, with no server round trip.
 */
export function useGenUIValue(name: string): JsonValue | undefined {
  const { store } = useSurfaceRoot();
  return useSyncExternalStore(
    store.subscribe,
    () => store.get(name),
    () => store.get(name),
  );
}
