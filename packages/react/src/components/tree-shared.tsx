import { createContext, useLayoutEffect, useRef, useState } from "react";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";

export interface TreeContextValue {
  activeKey: string;
  selectedKey: string;
  expanded: string[];
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  toggleExpanded: (key: string) => void;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
}

export const TreeContext = createContext<TreeContextValue | null>(null);

/** The aria-level of items at the current depth; each TreeGroup provides depth + 1. */
export const TreeLevelContext = createContext(1);

export interface TreeItemContextValue {
  value: string;
  /** A mounted TreeGroup marks its parent item expandable; returns a cleanup. */
  registerGroup: () => () => void;
}

export const TreeItemContext = createContext<TreeItemContextValue | null>(null);

export interface TreeGroupScopeContextValue {
  /** The scope's direct child item keys in DOM order, for aria-posinset and aria-setsize. */
  order: string[];
  registerPosition: (key: string, element: HTMLElement | null) => void;
}

export const TreeGroupScopeContext = createContext<TreeGroupScopeContextValue | null>(null);

/**
 * Tracks the direct child items of one group (or of the tree root) so each
 * can render aria-posinset and aria-setsize. Items record their element into
 * a ref during commit; the owner's layout effect — which runs after its
 * children's — then sorts the registrations into DOM order, bailing out when
 * nothing changed so re-renders cannot loop.
 */
export function useTreeGroupScope(): TreeGroupScopeContextValue {
  const positions = useRef(new Map<string, HTMLElement>());
  const [order, setOrder] = useState<string[]>([]);

  useLayoutEffect(() => {
    const entries = [...positions.current.entries()].map(([key, element]) => ({ key, element }));
    const next = sortItems(entries).map((entry) => entry.key);
    setOrder((current) => {
      const unchanged =
        current.length === next.length && current.every((key, index) => key === next[index]);
      if (unchanged) return current;
      return next;
    });
  });

  const registerPosition = (key: string, element: HTMLElement | null) => {
    if (element) positions.current.set(key, element);
    else positions.current.delete(key);
  };

  return { order, registerPosition };
}

/** The row's own text for typeahead: the item's content minus any nested group. */
export function treeRowText(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const group of clone.querySelectorAll('[role="group"]')) group.remove();
  return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
