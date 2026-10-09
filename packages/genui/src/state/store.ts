import { type JsonValue } from "../json/parse.js";

/** The values of the controls and bindings of one response, by state key. */
export type GenUIState = Readonly<Record<string, JsonValue>>;

/**
 * A tiny external store. Components read it with `useSyncExternalStore`, so a value changed in
 * one place re-renders exactly the controls and results that read it.
 */
export type GenUIStore = {
  /** The stored value, or `undefined` when nothing was stored under the key. */
  get(key: string): JsonValue | undefined;
  /** A snapshot of every stored value; the same object until something changes. */
  getSnapshot(): GenUIState;
  /** Stores a value as an edit (the person changed a control). `undefined` removes the key. */
  set(key: string, value: JsonValue | undefined): void;
  /**
   * Stores a default only when nothing is stored under the key. A seed is not an edit: it
   * notifies readers but not {@link GenUIStore.subscribeToEdits} listeners.
   */
  seed(key: string, value: JsonValue): void;
  /** Calls `listener` after every change, including seeds. Returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Calls `listener` with a snapshot after every edit. Returns the unsubscribe function. */
  subscribeToEdits(listener: (state: GenUIState) => void): () => void;
};

function sameValue(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  return false;
}

function isJson(value: unknown, depth = 0): value is JsonValue {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (depth > 8) return false;
  if (Array.isArray(value)) return value.every((item) => isJson(item, depth + 1));
  if (typeof value !== "object") return false;
  return Object.values(value).every((item) => isJson(item, depth + 1));
}

/**
 * Creates a store. `initial` restores a saved state, for example the object a host received from
 * `onStateChange`; entries that are not JSON values are ignored.
 */
export function createGenUIStore(initial: Readonly<Record<string, unknown>> = {}): GenUIStore {
  const values = new Map<string, JsonValue>();
  for (const [key, value] of Object.entries(initial)) {
    if (isJson(value)) values.set(key, value);
  }
  let snapshot: GenUIState = Object.fromEntries(values);
  const listeners = new Set<() => void>();
  const editListeners = new Set<(state: GenUIState) => void>();

  function commit(edit: boolean) {
    snapshot = Object.fromEntries(values);
    for (const listener of [...listeners]) listener();
    if (!edit) return;
    for (const listener of [...editListeners]) listener(snapshot);
  }

  return {
    get: (key) => values.get(key),
    getSnapshot: () => snapshot,
    set(key, value) {
      if (value === undefined) {
        if (!values.delete(key)) return;
      } else {
        if (!isJson(value) || sameValue(values.get(key), value)) return;
        values.set(key, value);
      }
      commit(true);
    },
    seed(key, value) {
      if (values.has(key) || !isJson(value)) return;
      values.set(key, value);
      commit(false);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    subscribeToEdits(listener) {
      editListeners.add(listener);
      return () => void editListeners.delete(listener);
    },
  };
}
