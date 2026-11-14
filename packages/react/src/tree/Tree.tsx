import { useState, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { useCollection, useCollectionNavigation, useControllableState } from "@comp0/core";
import { useCollectionPass, useCollectionSeed } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useTabStopSelection, useTabStopStore } from "../internal/tab-stop.js";
import {
  createTreeShape,
  TreeContext,
  TreeGroupScopeContext,
  TreeOwnerContext,
  useTreeScope,
  type TreeContextValue,
} from "./tree-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

export type TreeProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    /** Controlled or initial selected item; selection is single. */
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the selected item's value. */
    onChange?: ((value: string) => void) | undefined;
    /** Controlled or initial values of the open (expanded) items. */
    open?: string[] | undefined;
    defaultOpen?: string[] | undefined;
    /** Receives the next list of open item values. */
    onOpenChange?: ((open: string[]) => void) | undefined;
  };

export function Tree({
  as,
  value,
  defaultValue,
  onChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  onFocus,
  onKeyDown,
  children,
  ...props
}: TreeProps) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [open, setOpen] = useControllableState<string[]>({
    value: openProp,
    defaultValue: defaultOpen ?? [],
    onChange: onOpenChange,
  });
  const navigate = useCollectionNavigation();
  const collection = useCollection();
  const rootScope = useTreeScope();
  // The item that last held focus or was chosen, recorded under the selection current at the
  // time, else the selected item, else the first enabled item. Items inside a collapsed group
  // register as disabled, so the stop never sits in one: collapsing the group that holds it
  // hands the stop to the first visible item. The stop lives outside React state, so a focus
  // move re-renders only the two items whose tabIndex changes (bench:
  // collection-tab-stop.bench.tsx, PERFORMANCE.md).
  const selection = useTabStopSelection(selected);
  // On the server and while hydrating, the items are collected before they render, so the stop
  // is already resolved in server HTML.
  const seed = useCollectionSeed();
  // The same pass records each item's place among its siblings and which items own a group, so
  // aria-posinset, aria-setsize, and aria-expanded are in server HTML too.
  const [shape] = useState(createTreeShape);
  const pass = useCollectionPass(seed, children);
  const tabStops = useTabStopStore(collection, seed);
  const setFocusedKey = (key: string) => {
    tabStops.focus(key, selection);
  };

  // Arrow keys, Home/End, and typeahead walk VISIBLE rows only: a collapsed
  // TreeGroup renders with the hidden attribute, so checking each item's
  // ancestors for [hidden] excludes entire collapsed subtrees at once.
  const visibleItems = () =>
    collection
      .items()
      .filter((item) => item.element !== null && item.element.closest("[hidden]") === null);

  // Nested items contain their descendants, so the innermost registered element around the
  // target is the item it belongs to.
  const itemAround = (items: ReturnType<typeof visibleItems>, target: Node | null) =>
    items.filter((item) => target && item.element?.contains(target)).at(-1);

  const setItemOpen = (key: string, nextOpen: boolean) => {
    setOpen((current) => {
      const has = current.includes(key);
      if (nextOpen && !has) return [...current, key];
      if (!nextOpen && has) return current.filter((entry) => entry !== key);
      return current;
    });
  };

  const toggleOpen = (key: string) => {
    setOpen((current) => {
      if (current.includes(key)) return current.filter((entry) => entry !== key);
      return [...current, key];
    });
  };

  const focusItem = (key: string) => {
    const element = collection.get(key)?.element;
    if (!element) return;
    setFocusedKey(key);
    element.focus();
  };

  const context: TreeContextValue = {
    seed,
    shape,
    tabStops,
    selection,
    selectedKey: selected,
    open,
    setFocusedKey,
    setSelectedKey: setSelected,
    toggleOpen,
    collection,
  };

  const Part = partElement(as, "div");
  return (
    <TreeContext value={context}>
      <TreeOwnerContext value={null}>
        <TreeGroupScopeContext value={rootScope}>
          {pass}
          <Part
            {...props}
            role="tree"
            onFocus={(event: FocusEvent<HTMLDivElement>) => {
              onFocus?.(event);
              if (event.defaultPrevented) return;
              const item = itemAround(collection.items(), event.target);
              if (item && !item.disabled) setFocusedKey(item.key);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              const ownerWindow = event.currentTarget.ownerDocument.defaultView;
              const target =
                ownerWindow && event.target instanceof ownerWindow.HTMLElement
                  ? event.target
                  : null;
              const visible = visibleItems();
              const current = itemAround(visible, target);
              const currentElement = current?.element;
              if (!current || !currentElement) return;
              const rtl = writingDirection(event.currentTarget) === "rtl";
              const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
              const collapseKey = rtl ? "ArrowRight" : "ArrowLeft";

              if (event.key === expandKey) {
                // A descendant group can only belong to this item: groups only
                // ever render inside their own parent item.
                if (current.disabled || currentElement.querySelector('[role="group"]') === null) {
                  return;
                }
                event.preventDefault();
                if (!open.includes(current.key)) {
                  setItemOpen(current.key, true);
                  return;
                }
                // The first child of an expanded item is the next visible row
                // inside its element.
                const next = visible[visible.indexOf(current) + 1];
                if (next?.element && currentElement.contains(next.element)) focusItem(next.key);
                return;
              }
              if (event.key === collapseKey) {
                const expandable = currentElement.querySelector('[role="group"]') !== null;
                if (expandable && open.includes(current.key) && !current.disabled) {
                  event.preventDefault();
                  setItemOpen(current.key, false);
                  return;
                }
                const parent = visible
                  .filter((item) => item !== current && item.element?.contains(currentElement))
                  .at(-1);
                if (parent && !parent.disabled) {
                  event.preventDefault();
                  focusItem(parent.key);
                }
                return;
              }
              // Enter and Space select in TreeItem's own handler; anything they
              // handled arrives here already default-prevented.
              if (event.key === "Enter" || event.key === " ") return;
              const key = navigate(event.key, visible, current.key, { orientation: "vertical" });
              if (!key) return;
              event.preventDefault();
              focusItem(key);
            }}
          >
            {children}
          </Part>
        </TreeGroupScopeContext>
      </TreeOwnerContext>
    </TreeContext>
  );
}
