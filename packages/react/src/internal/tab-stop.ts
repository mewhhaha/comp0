import { useState, useSyncExternalStore } from "react";
import { type Collection, type CollectionItem } from "@comp0/core";
import { type CollectionSeed } from "./collection-pass.js";

/**
 * The first of `preferred` that is registered and enabled, else the first enabled item in
 * document order. Before any item registers (and on the server) it is resolved the same way
 * against `seed` when a collection pass filled one, else it is the first non-empty preferred key. The common case is one O(1) lookup per preferred key; only the fallback reads
 * document order.
 */
function resolveTabStop<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  preferred: readonly string[],
  seed?: CollectionSeed,
) {
  for (const key of preferred) {
    const item = key ? collection.get(key) : undefined;
    if (item && !item.disabled) return key;
  }
  const items = collection.items();
  if (items.length === 0 && seed && seed.size() > 0) {
    return preferred.find((key) => seed.isEnabled(key)) ?? seed.firstEnabled();
  }
  if (items.length === 0) return preferred.find(Boolean) ?? "";
  return items.find((item) => !item.disabled)?.key ?? "";
}

/**
 * The key of the one collection item rendered with tabIndex 0, read by the owner and passed
 * down. Registration, unregistration, and an item's own `disabled` change all notify the
 * collection, so the stop follows them without the owner re-rendering first. Items render
 * `tabIndex={tabStop === value ? 0 : -1}` instead of having it written after commit.
 *
 * Every item that reads the key re-renders when it moves. When items read it through context
 * and a key press moves it, prefer `useTabStopStore` with `useIsTabStop`, which re-renders only
 * the two items whose answer changes.
 *
 * Keep item registration stable (a ref callback must not depend on a context value that changes
 * with the stop), or every stop move re-registers every item and each notification recomputes
 * the snapshot.
 */
export function useTabStop<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  ...preferred: string[]
) {
  return useSyncExternalStore(
    collection.subscribe,
    () => resolveTabStop(collection, preferred),
    () => preferred.find(Boolean) ?? "",
  );
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
 */
export function useTabStopSelection(selected: string) {
  const [selection, setSelection] = useState<TabStopSelection>({ value: selected, epoch: 0 });
  if (selection.value === selected) return selection;
  const next = { value: selected, epoch: selection.epoch + 1 };
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
  /** Whether the root holds the stop: no item has registered and nothing is preferred. */
  rootIsStop: (selection: TabStopSelection) => boolean;
};

function createTabStopStore<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  seed?: CollectionSeed,
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
  const store: TabStopStore = {
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
    rootIsStop(selection) {
      // Document order is only read while no item holds the stop.
      return store.get(selection) === "" && collection.items().length === 0;
    },
  };
  return store;
}

/**
 * A tab stop that lives outside React state, so moving it re-renders only the items whose
 * `useIsTabStop` answer changes instead of every item that reads the owner's context. The stop
 * is resolved once per change and cached, so each item's snapshot is O(1).
 */
export function useTabStopStore<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  seed?: CollectionSeed,
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

/**
 * The root's own `tabIndex`. While no item has registered and nothing is preferred (server HTML
 * and the first render with nothing selected, or an empty collection) the root is the tab stop,
 * so the composite is not skipped by Tab before an item can take the stop. Otherwise it is -1:
 * out of the tab order, so Shift+Tab from an item leaves the composite, but still focusable, so
 * a root that was focused before its items registered keeps focus when the stop moves to an
 * item. A collection whose items are all disabled stays out of the tab order.
 */
export function useRootTabIndex(store: TabStopStore, selection: TabStopSelection = NO_SELECTION) {
  const rootIsStop = () => store.rootIsStop(selection);
  return useSyncExternalStore(store.subscribe, rootIsStop, rootIsStop) ? 0 : -1;
}

/** `useRootTabIndex` for an owner that reads the stop with `useTabStop`. */
export function useTabStopRootTabIndex<TItem extends CollectionItem<Element>>(
  collection: Collection<TItem>,
  tabStop: string,
) {
  // Document order is only read while no item holds the stop.
  const rootIsStop = useSyncExternalStore(
    collection.subscribe,
    () => !tabStop && collection.items().length === 0,
    () => !tabStop,
  );
  return rootIsStop ? 0 : -1;
}

/**
 * The item a key press on the root itself enters at: the stop for an arrow, so the first press
 * lands on the item Tab would have reached, and `target` (Home, End, typeahead) otherwise.
 */
export function rootEntryKey(eventKey: string, stop: string, target: string | undefined) {
  if (!target) return undefined;
  return eventKey.startsWith("Arrow") && stop ? stop : target;
}
