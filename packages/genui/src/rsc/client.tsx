"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import { BusyRegion } from "@comp0/react";
import { type PropShape } from "../catalog/schema.js";
import { builtInVocabulary } from "../composition/builtins.js";
import { compositionComponents } from "../composition/parts.js";
import { type Vocabulary } from "../composition/spec.js";
import { type StateContract, type StateValues } from "../composition/state.js";
import { expressionSource, resolveExpressions, validateProp } from "../composition/validate.js";
import { evaluateExpression } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";
import { GenUIContext, type GenUIAction } from "../render/context.js";
import { createGenUIStore, type GenUIState, type GenUIStore } from "../state/store.js";
import { toolCaller } from "../tools/http.js";
import { type ToolCaller } from "../tools/tools.js";
import { type GenUIError } from "../validate/errors.js";
import { Binding } from "../validate/values.js";
import { type ComponentRenderer } from "./components.js";
import {
  createEditStore,
  type ClientEdit,
  type EditableNode,
  type EditStore,
} from "./edit-store.js";

export type GenUIRootProps = {
  children?: ReactNode;
  /** Import the same vocabulary in the server view and this client scope. */
  vocabulary?: Vocabulary;
  /** Host-owned names, defaults and validators shared by controls and host components. */
  state?: StateContract;
  call?: ToolCaller | string | undefined;
  /** Refreshes one data component. The host supplies its framework's RSC transport. */
  render?: ComponentRenderer;
  onAction?: ((action: GenUIAction) => void | Promise<void>) | undefined;
  onError?: ((errors: readonly GenUIError[]) => void) | undefined;
  initialState?: Readonly<Record<string, JsonValue>> | undefined;
  store?: GenUIStore | undefined;
};

type Root = {
  store: GenUIStore;
  edits: EditStore;
  fields: GenUIStore;
  vocabulary: Vocabulary;
  render: ComponentRenderer | undefined;
  call: ToolCaller | undefined;
  act: (action: GenUIAction) => void;
  onError: GenUIRootProps["onError"];
};

/** Unbound form fields stay local; only declared bindings can change shared host state. */
function localFields(shared: GenUIStore, state: StateContract | undefined): GenUIStore {
  if (!state) return shared;
  const local = createGenUIStore();
  let snapshot = { ...local.getSnapshot(), ...shared.getSnapshot() };
  const subscribers = new Set<() => void>();
  let stopShared = () => {};
  let stopLocal = () => {};
  function update() {
    snapshot = { ...local.getSnapshot(), ...shared.getSnapshot() };
    for (const listener of subscribers) listener();
  }
  const target = (name: string) => {
    if (Object.hasOwn(state.shape, name)) return shared;
    return local;
  };
  return {
    get: (name) => target(name).get(name),
    set: (name, value) => target(name).set(name, value),
    seed: (name, value) => target(name).seed(name, value),
    getSnapshot() {
      // Subscribe callbacks keep this stable; before subscribing, refresh from current stores.
      if (subscribers.size === 0) {
        const next = { ...local.getSnapshot(), ...shared.getSnapshot() };
        if (JSON.stringify(snapshot) !== JSON.stringify(next)) snapshot = next;
      }
      return snapshot;
    },
    subscribe(listener) {
      if (subscribers.size === 0) {
        stopShared = shared.subscribe(update);
        stopLocal = local.subscribe(update);
      }
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
        if (subscribers.size === 0) {
          stopShared();
          stopLocal();
        }
      };
    },
    subscribeToEdits(listener) {
      const changed = () => listener({ ...local.getSnapshot(), ...shared.getSnapshot() });
      const stopShared = shared.subscribeToEdits(changed);
      const stopLocal = local.subscribeToEdits(changed);
      return () => {
        stopShared();
        stopLocal();
      };
    },
  };
}
const RootContext = createContext<Root | null>(null);
function useRoot(): Root {
  const root = use(RootContext);
  if (root === null) throw new Error("GenUI views and hooks must render inside <GenUIRoot>.");
  return root;
}

/** Client scope for all views and host components sharing one typed state contract. */
export function GenUIRoot({
  children,
  vocabulary = builtInVocabulary,
  state,
  call,
  render,
  onAction,
  onError,
  initialState,
  store: provided,
}: GenUIRootProps) {
  const [edits] = useState(createEditStore);
  const [own] = useState(() => {
    if (state) return state.createStore(initialState);
    return createGenUIStore(initialState);
  });
  // Semantic identity: queries rerun when the caller changes, so a URL keeps one caller.
  const caller = useMemo(() => toolCaller(call), [call]);
  const store = provided ?? own;
  // Semantic identity: the local form store must survive renders of its provider.
  const fields = useMemo(() => localFields(store, state), [store, state]);
  const root: Root = {
    store,
    edits,
    fields,
    vocabulary,
    render,
    call: caller,
    act: (action) => void onAction?.(action),
    onError,
  };
  return <RootContext value={root}>{children}</RootContext>;
}

type View = { streaming: boolean; setStreaming: (streaming: boolean) => void };
const ViewContext = createContext<View | null>(null);
function useView(): View {
  const view = use(ViewContext);
  if (view === null) throw new Error("A GenUI node must render inside <GenUIView>.");
  return view;
}
const noBindings = new Map<string, JsonValue | undefined>();
const noSlots: Readonly<Record<string, ReactNode>> = {};

export function GenUIViewScope({ children }: { children?: ReactNode }) {
  const root = useRoot();
  const id = useId();
  const [streaming, setStreaming] = useState(true);
  const context = {
    store: root.fields,
    fieldPrefix: `view:${id}:`,
    streaming,
    bindings: noBindings,
    call: root.call,
    slots: noSlots,
    act: (action: GenUIAction) => {
      if (!streaming) root.act(action);
    },
  };
  return (
    <ViewContext value={{ streaming, setStreaming }}>
      <GenUIContext value={context}>
        <BusyRegion busy={streaming} data-slot="genui-view">
          {children}
        </BusyRegion>
      </GenUIContext>
    </ViewContext>
  );
}

export type GenUIClientNodeProps = {
  name: string;
  component?: ComponentType<never> | undefined;
  props: Record<string, JsonValue>;
  binding?: string | undefined;
  text?: readonly (string | { $expr: string })[] | undefined;
  children?: ReactNode;
};

/** Custom client components and built-ins receive validated props and streamed React children. */
export function GenUIClientNode({
  name,
  component,
  props: raw,
  binding,
  text,
  children,
}: GenUIClientNodeProps) {
  const root = useRoot();
  const values = useSyncExternalStore(
    root.store.subscribe,
    root.store.getSnapshot,
    root.store.getSnapshot,
  );
  const entry = root.vocabulary.specs.find((item) => item.name === name);
  const props: Record<string, unknown> = resolveExpressions(raw, values);
  let content = children;
  if (text) {
    const label = text
      .map((part) => {
        if (typeof part === "string") return part;
        const value = evaluateExpression(part.$expr, values);
        if (typeof value === "string" || typeof value === "number") return String(value);
        return "";
      })
      .join("");
    if (label.trim() === "") return null;
    content = label;
  }
  if (entry) {
    for (const [key, value] of Object.entries(raw)) {
      if (expressionSource(value) === undefined) continue;
      const schema = entry.props[key] ?? entry.props[`${key}?`];
      if (!schema) return null;
      const checked = validateProp(schema, props[key]);
      if (!checked.ok) return null;
      if (
        ["label", "title", "caption"].includes(key) &&
        typeof checked.value === "string" &&
        checked.value.trim() === ""
      )
        return null;
      props[key] = checked.value;
    }
    if (binding && entry.binding) props[entry.binding.prop] = new Binding(binding, values[binding]);
  }
  const Component = (component ??
    Object.getOwnPropertyDescriptor(compositionComponents, name)?.value) as
    | ComponentType<Record<string, unknown>>
    | undefined;
  if (!Component) return null;
  return <Component {...props}>{content}</Component>;
}

export function GenUIExpression({ source }: { source: string }) {
  const values = useGenUIState();
  const result = evaluateExpression(source, values);
  if (result === null || typeof result === "boolean") return null;
  return <>{result}</>;
}

/** An explicit protocol ID adds an addressable boundary without replacing its mounted children. */
export function GenUIEditable({
  node: initial,
  scope = "",
  component,
  initialProps,
  children,
}: {
  node: EditableNode;
  scope?: string;
  component?: ComponentType<never> | undefined;
  /** Present for a server component, even when its initial props contain no expressions. */
  initialProps?: Record<string, JsonValue> | undefined;
  children?: ReactNode;
}) {
  const { edits, onError } = useRoot();
  const owner = useId();
  const target = useSyncExternalStore(
    edits.subscribe,
    () => edits.get(scope, initial.id),
    () => undefined,
  );
  useEffect(() => {
    const errors = edits.register(scope, owner, initial);
    if (errors.length) onError?.(errors);
    return () => edits.unregister(scope, initial.id, owner);
  }, [edits, scope, owner, initial, onError]);
  if (target?.owner !== undefined && target.owner !== owner) return null;
  const node = target?.node ?? initial;
  if (initialProps) {
    return (
      <GenUIServerNode name={node.name} props={node.inputs} initialProps={initialProps}>
        {children}
      </GenUIServerNode>
    );
  }
  return (
    <GenUIClientNode
      name={node.name}
      component={component}
      props={node.props}
      binding={node.binding}
      text={node.text}
    >
      {children}
      {target?.appends}
    </GenUIClientNode>
  );
}

/** Complete edit turns commit once. Validation failures never mutate an accepted view. */
export function GenUIApplyEdits({
  turn,
  scope = "",
  operations,
  errors,
}: {
  turn: string;
  scope?: string;
  operations: readonly ClientEdit[];
  errors: readonly GenUIError[];
}) {
  const { edits, onError } = useRoot();
  const { setStreaming } = useView();
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    let problems = errors;
    if (problems.length === 0) problems = edits.apply(turn, scope, operations);
    setStreaming(false);
    if (problems.length) onError?.(problems);
  }, [edits, turn, scope, operations, errors, onError, setStreaming]);
  return null;
}

/** Keeps the accepted subtree while the latest dependent props are rendered on the server. */
export function GenUIServerNode({
  name,
  props,
  initialProps,
  children,
}: {
  name: string;
  props: Record<string, JsonValue>;
  initialProps: Record<string, JsonValue>;
  children?: ReactNode;
}) {
  const root = useRoot();
  const values = useGenUIState();
  const resolved = resolveExpressions(props, values);
  const signature = JSON.stringify(resolved);
  const initialSignature = JSON.stringify(initialProps);
  const [result, setResult] = useState<{ signature: string; content: ReactNode }>({
    signature: initialSignature,
    content: children,
  });
  const [failure, setFailure] = useState<{ signature: string; message: string }>();
  const render = root.render;
  useEffect(() => {
    if (signature === result.signature) return;
    if (!render) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() =>
          render(name, JSON.parse(signature) as Record<string, JsonValue>, controller.signal),
        )
        .then(
          (content) => {
            if (!controller.signal.aborted) setResult({ signature, content });
          },
          () => {
            if (!controller.signal.aborted)
              setFailure({ signature, message: "This view could not be updated." });
          },
        );
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [render, name, signature, result.signature]);
  let message: string | undefined;
  if (signature !== result.signature) {
    if (!render) message = "This component needs a server renderer.";
    if (failure?.signature === signature) message = failure.message;
  }
  return (
    <BusyRegion
      data-slot="server-component"
      busy={signature !== result.signature && message === undefined}
    >
      {result.content}
      {message && <output>{message}</output>}
    </BusyRegion>
  );
}

export function GenUIStreamEnd({ errors }: { errors: readonly GenUIError[] }) {
  const { setStreaming } = useView();
  const { onError } = useRoot();
  const reported = useRef(false);
  useEffect(() => {
    setStreaming(false);
    if (!reported.current && errors.length && onError) {
      reported.current = true;
      onError(errors);
    }
  }, [setStreaming, onError, errors]);
  return null;
}

export function useGenUIStore(): GenUIStore {
  return useRoot().store;
}

export function useGenUIValue<T extends PropShape, K extends keyof T & string>(
  contract: StateContract<T>,
  name: K,
): StateValues<T>[K];
export function useGenUIValue(name: string): JsonValue | undefined;
export function useGenUIValue(contractOrName: StateContract | string, key?: string): unknown {
  const { store } = useRoot();
  let name = key ?? "";
  if (typeof contractOrName === "string") name = contractOrName;
  const value = useSyncExternalStore(
    store.subscribe,
    () => store.get(name),
    () => store.get(name),
  );
  if (value === undefined && typeof contractOrName !== "string")
    return contractOrName.initial[name];
  return value;
}

export function useGenUIState(): GenUIState {
  const { store } = useRoot();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
export function useGenUICall(): ToolCaller | undefined {
  return useRoot().call;
}
