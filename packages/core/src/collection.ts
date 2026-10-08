import { useState } from "react";
import { getRovingFocusTarget, type RovingFocusOrientation } from "./roving-focus.js";
import { findTypeaheadMatch, useTypeaheadSearch } from "./typeahead.js";

/** A registered collection entry, independent from the element used to render it. */
export type CollectionItem = {
  /** Stable application identity (the public `value`) used for selection, focus, and lookup. */
  key: string;
  /** The rendered element's DOM id, for aria-activedescendant and other id references. */
  id?: string | undefined;
  /** The text the item is known by for typeahead, filtering, and display. */
  textValue: string;
  disabled?: boolean | undefined;
  element: HTMLElement | null;
};

/** A registry of collection items read back in document order. */
export type Collection<TItem extends CollectionItem = CollectionItem> = {
  /**
   * Adds or updates the item stored under `item.key`; an item with a `null` element is
   * unregistered instead. Re-registering an unchanged item is a no-op, so parts may register
   * on every render. Returns whether the registry changed.
   */
  register: (item: TItem) => boolean;
  /**
   * Removes the item stored under `key`. When `element` is given, the item is only removed
   * while that element is still the registered one, so a stale cleanup cannot remove a
   * replacement. Returns whether the registry changed.
   */
  unregister: (key: string, element?: HTMLElement | null) => boolean;
  get: (key: string) => TItem | undefined;
  /** Every registered item in document order. */
  items: () => TItem[];
  /** Registered items that are not disabled, in document order. */
  enabledItems: () => TItem[];
  /** Calls `listener` after every change; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
};

/** Returns a copy of the items sorted into their elements' document order. */
export function sortByDocumentPosition<TItem extends { element: Element | null }>(
  items: readonly TItem[],
) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });
}

function inDocumentOrder(items: readonly { element: Element | null }[]) {
  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1]?.element;
    const next = items[index]?.element;
    if (!previous || !next) continue;
    if (previous.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_PRECEDING) return false;
  }
  return true;
}

function sameItem(a: CollectionItem, b: CollectionItem) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!Object.is(a[key as keyof CollectionItem], b[key as keyof CollectionItem])) return false;
  }
  return true;
}

/** Creates a collection registry outside React, e.g. for tests or non-component owners. */
export function createCollection<
  TItem extends CollectionItem = CollectionItem,
>(): Collection<TItem> {
  const registry = new Map<string, TItem>();
  const listeners = new Set<() => void>();
  let sorted: TItem[] | null = null;

  const changed = () => {
    sorted = null;
    for (const listener of listeners) listener();
    return true;
  };

  const collection: Collection<TItem> = {
    register(item) {
      if (!item.element) return collection.unregister(item.key);
      const current = registry.get(item.key);
      if (current && sameItem(current, item)) return false;
      registry.set(item.key, item);
      return changed();
    },
    unregister(key, element) {
      const current = registry.get(key);
      if (!current) return false;
      if (element && current.element !== element) return false;
      registry.delete(key);
      return changed();
    },
    get(key) {
      return registry.get(key);
    },
    items() {
      // Keyed reorders move existing elements without re-registering them, so a cached order
      // is re-validated (linear) before it is reused.
      if (!sorted || !inDocumentOrder(sorted)) {
        sorted = sortByDocumentPosition([...registry.values()]);
      }
      return sorted;
    },
    enabledItems() {
      return collection.items().filter((item) => !item.disabled);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return collection;
}

/**
 * Returns a collection registry whose identity is stable for the component's lifetime, so it
 * can be passed through context and used in effect dependencies.
 */
export function useCollection<TItem extends CollectionItem = CollectionItem>() {
  const [collection] = useState(() => createCollection<TItem>());
  return collection;
}

/** How a collection's keyboard navigation resolves arrow, Home, End, and typeahead keys. */
export type CollectionNavigationOptions = {
  /** Which arrow keys move; defaults to "both". */
  orientation?: RovingFocusOrientation | undefined;
  /** Writing direction for horizontal arrows; defaults to "ltr". */
  dir?: "ltr" | "rtl" | undefined;
  /** Wraps from the last item to the first and back; defaults to false. */
  loop?: boolean | undefined;
  /** Matches printable keys against item text; defaults to true. */
  typeahead?: boolean | undefined;
};

/** The fields keyboard navigation reads from an item. */
export type NavigableItem = {
  key: string;
  textValue: string;
  disabled?: boolean | undefined;
};

/**
 * Returns a resolver for a collection key press: arrow keys, Home, and End resolve the APG
 * roving target, and other printable keys extend a typeahead search owned by this hook.
 * The resolver returns the target item's key, or `undefined` when the key does not navigate.
 * What happens next (focus the element, move aria-activedescendant, select) is the caller's
 * policy.
 */
export function useCollectionNavigation(typeaheadTimeout?: number) {
  const search = useTypeaheadSearch(typeaheadTimeout);

  return (
    key: string,
    items: readonly NavigableItem[],
    currentKey: string | undefined,
    options: CollectionNavigationOptions = {},
  ) => {
    const target = getRovingFocusTarget(items, currentKey, key, options);
    if (target || key.length !== 1 || options.typeahead === false) return target;
    return findTypeaheadMatch(items, search(key), currentKey);
  };
}
