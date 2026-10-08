import { createContext, useLayoutEffect, useState } from "react";
import { useCollection, type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type TreeContextValue = {
  activeKey: string;
  selectedKey: string;
  open: string[];
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  toggleOpen: (key: string) => void;
  register: (item: CollectionItem) => void;
  collection: Collection;
};

export const [TreeContext, useTreeContext, useOptionalTreeContext] =
  createRequiredContext<TreeContextValue>("Tree");

/** The aria-level of items at the current depth; each TreeGroup provides depth + 1. */
export const TreeLevelContext = createContext(1);

export type TreeItemContextValue = {
  value: string;
  /** A mounted TreeGroup marks its parent item expandable; returns a cleanup. */
  registerGroup: () => () => void;
};

export const [TreeItemContext, useTreeItemContext, useOptionalTreeItemContext] =
  createRequiredContext<TreeItemContextValue>("TreeItem");

export type TreeGroupScopeContextValue = {
  /** The scope's direct child item keys in DOM order, for aria-posinset and aria-setsize. */
  order: string[];
  collection: Collection;
};

export const [TreeGroupScopeContext, useTreeGroupScopeContext, useOptionalTreeGroupScopeContext] =
  createRequiredContext<TreeGroupScopeContextValue>("Tree");

/**
 * Tracks the direct child items of one group (or of the tree root) so each
 * can render aria-posinset and aria-setsize. Items register into the scope's
 * collection; the owner reads the DOM order whenever it changes, bailing out
 * when nothing moved so re-renders cannot loop.
 */
export function useTreeGroupScope(): TreeGroupScopeContextValue {
  const collection = useCollection();
  const [order, setOrder] = useState<string[]>([]);

  useLayoutEffect(() => {
    const sync = () =>
      setOrder((current) => {
        const next = collection.items().map((item) => item.key);
        const unchanged =
          current.length === next.length && current.every((key, index) => key === next[index]);
        if (unchanged) return current;
        return next;
      });
    // Children registered before this effect subscribed.
    sync();
    return collection.subscribe(sync);
  }, [collection]);

  return { order, collection };
}

/** The row's own text for typeahead: the item's content minus any nested group. */
export function treeRowText(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const group of clone.querySelectorAll('[role="group"]')) group.remove();
  return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
