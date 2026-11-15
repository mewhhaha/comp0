import { createContext, useState } from "react";
import { createCollection, type Collection, type CollectionItem } from "@comp0/core";
import { type CollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { type TabStopSelection, type TabStopStore } from "../internal/tab-stop.js";

/** A registered tree item, with the item whose group holds it (`null` at the root). */
export type TreeCollectionItem = CollectionItem & { parent: string | null };

export type TreeContextValue = {
  /** What the collection pass and the items fill on the server and while hydrating. */
  seed: CollectionSeed;
  /** The tree's shape as the collection pass sees it, for the items' server snapshots. */
  shape: TreeShape;
  /** The one item rendered with tabIndex 0; items read it with `useIsTabStop`. */
  tabStops: TabStopStore;
  /** The numbered selection the stop is resolved under. */
  selection: TabStopSelection;
  selectedKey: string;
  open: string[];
  /** Records the item that holds focus or was chosen, so the stop stays on it. */
  setFocusedKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  toggleOpen: (key: string) => void;
  /**
   * Every item in the tree; each registers and unregisters itself on this stable object. An
   * item inside a collapsed group registers as disabled, so the stop never lands on it: it goes to
   * the nearest ancestor in reach, read from each item's `parent`.
   */
  collection: Collection<TreeCollectionItem>;
};

export const [TreeContext, useTreeContext, useOptionalTreeContext] =
  createRequiredContext<TreeContextValue>("Tree");

/** The aria-level of items at the current depth; each TreeGroup provides depth + 1. */
export const TreeLevelContext = createContext(1);

/** Whether items at this depth sit inside a collapsed group; each TreeGroup provides it. */
export const TreeCollapsedContext = createContext(false);

export type TreeItemContextValue = {
  value: string;
  /** A mounted TreeGroup marks its parent item expandable; returns a cleanup. */
  registerGroup: () => () => void;
};

export const [TreeItemContext, useTreeItemContext, useOptionalTreeItemContext] =
  createRequiredContext<TreeItemContextValue>("TreeItem");

/**
 * The sibling set the collection pass records items at this depth into: `null` at the root, and
 * a token of each TreeGroup's own otherwise, so a group without an owning item still numbers its
 * items as a set of their own. Tree provides `null`, so a tree nested inside another tree's item
 * starts its own root. Only the pass reads it.
 */
export type TreeSet = object | null;
export const TreeSetContext = createContext<TreeSet>(null);

/**
 * What the collection pass sees of the tree's shape: each item's place among its siblings and
 * which items own a group. It only fills on the server and while hydrating, and items read it
 * only as their server snapshot, so a later client render never sees a stale answer.
 */
export type TreeShape = {
  /**
   * Records an item in its sibling set, under the item whose group holds it; a key already
   * recorded keeps its first position.
   */
  add: (set: TreeSet, key: string, parent: string | null) => void;
  /** Records that the item `key` renders a TreeGroup. */
  addGroup: (key: string) => void;
  /** The item's 1-based position among its siblings, if recorded. */
  position: (key: string) => number | undefined;
  /** How many items the item's sibling set holds, if the item was recorded. */
  size: (key: string) => number | undefined;
  hasGroup: (key: string) => boolean;
  /** The item whose group holds `key`, if recorded. */
  parent: (key: string) => string | null | undefined;
};

export function createTreeShape(): TreeShape {
  const positions = new Map<string, number>();
  const sets = new Map<string, TreeSet>();
  const sizes = new Map<TreeSet, number>();
  const parents = new Map<string, string | null>();
  const groups = new Set<string>();
  return {
    add(set, key, parent) {
      if (positions.has(key)) return;
      const size = (sizes.get(set) ?? 0) + 1;
      sizes.set(set, size);
      positions.set(key, size);
      sets.set(key, set);
      parents.set(key, parent);
    },
    addGroup(key) {
      groups.add(key);
    },
    position: (key) => positions.get(key),
    size: (key) => (sets.has(key) ? sizes.get(sets.get(key) ?? null) : undefined),
    hasGroup: (key) => groups.has(key),
    parent: (key) => parents.get(key),
  };
}

/**
 * The direct child items of one group (or of the tree root), for aria-posinset and
 * aria-setsize. Items register into its collection; the positions are read from document order
 * once per change and cached, so each item's snapshot is an O(1) lookup and a change re-renders
 * only the items whose position or set size moved.
 */
export type TreeScope = {
  collection: Collection;
  subscribe: (listener: () => void) => () => void;
  /** The registered item's 1-based position in document order. */
  position: (key: string) => number | undefined;
  /** How many items are registered, or `undefined` while none are. */
  size: () => number | undefined;
};

function createTreeScope(): TreeScope {
  const collection = createCollection();
  const listeners = new Set<() => void>();
  let positions: Map<string, number> | null = null;
  // The scope owns its collection, so listening for the scope's whole life leaks nothing.
  collection.subscribe(() => {
    positions = null;
    for (const listener of listeners) listener();
  });
  const read = () => {
    positions ??= new Map(collection.items().map((item, index) => [item.key, index + 1]));
    return positions;
  };
  return {
    collection,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    position: (key) => read().get(key),
    size: () => read().size || undefined,
  };
}

export const [TreeGroupScopeContext, useTreeGroupScopeContext] =
  createRequiredContext<TreeScope>("Tree");

export function useTreeScope() {
  const [scope] = useState(createTreeScope);
  return scope;
}

/** How many TreeGroups an item renders, for its aria-expanded. */
export type TreeGroupCount = {
  register: () => () => void;
  subscribe: (listener: () => void) => () => void;
  has: () => boolean;
};

function createTreeGroupCount(): TreeGroupCount {
  const listeners = new Set<() => void>();
  let count = 0;
  const change = (by: number) => {
    count += by;
    for (const listener of listeners) listener();
  };
  return {
    register() {
      change(1);
      return () => change(-1);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    has: () => count > 0,
  };
}

export function useTreeGroupCount() {
  const [groups] = useState(createTreeGroupCount);
  return groups;
}

/** The row's own text for typeahead: the item's content minus any nested group. */
export function treeRowText(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const group of clone.querySelectorAll('[role="group"]')) group.remove();
  return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
