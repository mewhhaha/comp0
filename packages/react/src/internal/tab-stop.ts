import { useState, useSyncExternalStore } from "react";
import { type Collection, type CollectionItem } from "@comp0/core";
import { type CollectionSeed } from "./collection-pass.js";

/**
 * The first of `preferred` that is registered and enabled, else the first enabled item in
 * document order. Before any item registers (and on the server) it is resolved the same way
 * against `seed` when the root's items filled it, else it is the first non-empty preferred key.
 * The common case is one O(1) lookup per preferred key; only the fallback reads document order.
 */
function resolveTabStop<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  preferred: readonly string[],
  seed: CollectionSeed,
) {
  for (const key of preferred) {
    const item = key ? collection.get(key) : undefined;
    if (!item || item.disabled) continue;
    seed.clear();
    return key;
  }
  const items = collection.items();
  if (items.length === 0) return seed.resolve(preferred) ?? preferred.find(Boolean) ?? "";
  // Registered elements are the source of truth from here on. Dropping the seed here rather
  // than in an effect also covers items React hydrates late, inside a Suspense boundary.
  seed.clear();
  return items.find((item) => !item.disabled)?.key ?? "";
}

/**
 * The owner's selected key, numbered each time it changes. A recorded focus remembers the
 * selection it was made under, so a selection that returns later (a → c → a) cannot revive it.
 */
export type TabStopSelection = { value: string; epoch: number };

/** For owners without a selection, such as Menubar. */
export const NO_SELECTION: TabStopSelection = { value: "", epoch: 0 };

/**
 * Numbers the owner's selection during render (adjusting state, so no effect or extra commit).
 * The result is stable until `selected` changes, so passing it through context re-renders items
 * only when the selection does.
 *
 * An owner that clears its focus record when focus leaves (Tabs) passes `keepFocusRecord`: the
 * record cannot go stale there, and a selection changed from outside must leave the stop on the
 * item that holds focus.
 */
export function useTabStopSelection(selected: string, keepFocusRecord = false) {
  const [selection, setSelection] = useState<TabStopSelection>({ value: selected, epoch: 0 });
  if (selection.value === selected) return selection;
  const epoch = keepFocusRecord ? selection.epoch : selection.epoch + 1;
  const next = { value: selected, epoch };
  setSelection(next);
  return next;
}

/** The owner's handle on a fine-grained tab stop: items read it with `useIsTabStop`. */
export type TabStopStore = {
  subscribe: (listener: () => void) => () => void;
  /** The key of the one item rendered with tabIndex 0 under `selection`. */
  get: (selection: TabStopSelection) => string;
  /**
   * Records the item that holds focus or was chosen, under the selection current at the time.
   * The stop follows it while it stays enabled and the selection does not change; clearing the
   * selection keeps it.
   */
  focus: (key: string, selection: TabStopSelection) => void;
};

function createTabStopStore<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  seed: CollectionSeed,
): TabStopStore {
  const listeners = new Set<() => void>();
  let focused = { key: "", epoch: 0 };
  // Valid only while subscribed to the collection, which is what invalidates it.
  let cached: { selection: TabStopSelection; key: string } | null = null;
  let unsubscribeCollection: (() => void) | null = null;
  const notify = () => {
    cached = null;
    for (const listener of listeners) listener();
  };
  const resolve = (selection: TabStopSelection) => {
    let key = "";
    if (focused.epoch === selection.epoch) key = focused.key;
    // A record survives one change of selection, and only when that change cleared it.
    else if (!selection.value && focused.epoch === selection.epoch - 1) key = focused.key;
    return resolveTabStop(collection, [key, selection.value], seed);
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      unsubscribeCollection ??= collection.subscribe(notify);
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0 || !unsubscribeCollection) return;
        unsubscribeCollection();
        unsubscribeCollection = null;
        cached = null;
      };
    },
    get(selection) {
      if (!unsubscribeCollection) return resolve(selection);
      if (cached?.selection !== selection) cached = { selection, key: resolve(selection) };
      return cached.key;
    },
    focus(key, selection) {
      if (focused.key === key && focused.epoch === selection.epoch) return;
      focused = { key, epoch: selection.epoch };
      notify();
    },
  };
}

/**
 * The one collection item rendered with tabIndex 0. It lives outside React state, so moving it
 * re-renders only the items whose `useIsTabStop` answer changes instead of every item that
 * reads the owner's context. Registration, unregistration, and an item's own `disabled` change
 * all notify it, and the stop is resolved once per change and cached, so each item's snapshot
 * is O(1). Pass the root's `seed` so the stop is already resolved on the server.
 *
 * Keep item registration stable (a ref callback must not depend on a context value that changes
 * with the stop), or every stop move re-registers every item and each notification recomputes
 * the snapshot.
 */
export function useTabStopStore<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  seed: CollectionSeed,
) {
  const [store] = useState(() => createTabStopStore(collection, seed));
  return store;
}

/** Whether `key` is the item rendered with tabIndex 0 under `selection`. */
export function useIsTabStop(
  store: TabStopStore,
  key: string,
  selection: TabStopSelection = NO_SELECTION,
) {
  const isTabStop = () => store.get(selection) === key;
  return useSyncExternalStore(store.subscribe, isTabStop, isTabStop);
}
