import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import {
  findTypeaheadMatch,
  getRovingFocusTarget,
  useControllableState,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";
import {
  TreeContext,
  TreeGroupScopeContext,
  useTreeGroupScope,
  type TreeContextValue,
} from "./tree-shared.js";

export type TreeProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  /** Controlled or initial selected item; selection is single. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected item's value. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial expanded item values. */
  expanded?: string[] | undefined;
  defaultExpanded?: string[] | undefined;
  onExpandedChange?: ((expanded: string[]) => void) | undefined;
};

export function Tree({
  value,
  defaultValue,
  onChange,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  onKeyDown,
  children,
  ref,
  ...props
}: TreeProps & RefProp<HTMLDivElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [expanded, setExpanded] = useControllableState<string[]>({
    value: expandedProp,
    defaultValue: defaultExpanded ?? [],
    onChange: onExpandedChange,
  });
  const typeaheadSearch = useTypeaheadSearch();
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const rootScope = useTreeGroupScope();

  useEffect(() => {
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const register = (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => {
    if (!element) {
      itemMap.current.delete(key);
      return;
    }
    itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
  };

  const items = () => sortItems([...itemMap.current.values()]);

  // Arrow keys, Home/End, and typeahead walk VISIBLE rows only: a collapsed
  // TreeGroup renders with the hidden attribute, so checking each item's
  // ancestors for [hidden] excludes entire collapsed subtrees at once.
  const visibleItems = () =>
    items().filter((item) => item.element !== null && item.element.closest("[hidden]") === null);

  // The roving tab stop must sit on a visible, enabled item: nothing is
  // active on first render, and the selected item can live inside a
  // collapsed group. Runs after every commit and bails when already valid.
  useEffect(() => {
    const visible = visibleItems().filter((item) => !item.disabled);
    if (visible.some((item) => item.key === activeKeyRef.current)) return;
    const first = visible[0];
    if (!first) return;
    activeKeyRef.current = first.key;
    setActiveKey(first.key);
  });

  const setItemExpanded = (key: string, nextExpanded: boolean) => {
    setExpanded((current) => {
      const has = current.includes(key);
      if (nextExpanded && !has) return [...current, key];
      if (!nextExpanded && has) return current.filter((entry) => entry !== key);
      return current;
    });
  };

  const toggleExpanded = (key: string) => {
    setExpanded((current) => {
      if (current.includes(key)) return current.filter((entry) => entry !== key);
      return [...current, key];
    });
  };

  const focusItem = (key: string) => {
    const element = itemMap.current.get(key)?.element;
    if (!element) return;
    activeKeyRef.current = key;
    setActiveKey(key);
    element.focus();
  };

  const context: TreeContextValue = {
    activeKey,
    selectedKey: selected,
    expanded,
    setActiveKey,
    setSelectedKey: setSelected,
    toggleExpanded,
    register,
    items,
  };

  return (
    <TreeContext value={context}>
      <TreeGroupScopeContext value={rootScope}>
        <div
          {...props}
          ref={ref}
          role="tree"
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const ownerWindow = event.currentTarget.ownerDocument.defaultView;
            const target =
              ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
            const itemElement = target?.closest('[role="treeitem"]');
            const visible = visibleItems();
            const current = visible.find((item) => item.element === itemElement);
            const currentElement = current?.element;
            if (!current || !currentElement) return;

            if (event.key === "ArrowRight") {
              // A descendant group can only belong to this item: groups only
              // ever render inside their own parent item.
              if (current.disabled || currentElement.querySelector('[role="group"]') === null) {
                return;
              }
              event.preventDefault();
              if (!expanded.includes(current.key)) {
                setItemExpanded(current.key, true);
                return;
              }
              // The first child of an expanded item is the next visible row
              // inside its element.
              const next = visible[visible.indexOf(current) + 1];
              if (next?.element && currentElement.contains(next.element)) focusItem(next.key);
              return;
            }
            if (event.key === "ArrowLeft") {
              const expandable = currentElement.querySelector('[role="group"]') !== null;
              if (expandable && expanded.includes(current.key) && !current.disabled) {
                event.preventDefault();
                setItemExpanded(current.key, false);
                return;
              }
              const parentElement = currentElement.parentElement?.closest('[role="treeitem"]');
              const parent = visible.find((item) => item.element === parentElement);
              if (parent && !parent.disabled) {
                event.preventDefault();
                focusItem(parent.key);
              }
              return;
            }
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              const key = getRovingFocusTarget(visible, current.key, event.key, {
                orientation: "vertical",
              });
              if (key) {
                event.preventDefault();
                focusItem(key);
              }
              return;
            }
            // Enter and Space select in TreeItem's own handler; anything they
            // handled arrives here already default-prevented.
            if (event.key === "Enter" || event.key === " ") return;
            if (event.key.length === 1) {
              const key = findTypeaheadMatch(visible, typeaheadSearch(event.key), current.key);
              if (key) {
                event.preventDefault();
                focusItem(key);
              }
            }
          }}
        >
          {children}
        </div>
      </TreeGroupScopeContext>
    </TreeContext>
  );
}
