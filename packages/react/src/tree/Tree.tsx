import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { useCollection, useCollectionNavigation, useControllableState } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  TreeContext,
  TreeGroupScopeContext,
  useTreeGroupScope,
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
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const collection = useCollection();
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

  // Arrow keys, Home/End, and typeahead walk VISIBLE rows only: a collapsed
  // TreeGroup renders with the hidden attribute, so checking each item's
  // ancestors for [hidden] excludes entire collapsed subtrees at once.
  const visibleItems = () =>
    collection
      .items()
      .filter((item) => item.element !== null && item.element.closest("[hidden]") === null);

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
    activeKeyRef.current = key;
    setActiveKey(key);
    element.focus();
  };

  const context: TreeContextValue = {
    activeKey,
    selectedKey: selected,
    open,
    setActiveKey,
    setSelectedKey: setSelected,
    toggleOpen,
    register: collection.register,
    collection,
  };

  const Part = partElement(as, "div");
  return (
    <TreeContext value={context}>
      <TreeGroupScopeContext value={rootScope}>
        <Part
          {...props}
          role="tree"
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const ownerWindow = event.currentTarget.ownerDocument.defaultView;
            const target =
              ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
            const visible = visibleItems();
            // Nested items contain their descendants, so the innermost
            // registered element around the target is the focused item.
            const current = visible
              .filter((item) => target && item.element?.contains(target))
              .at(-1);
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
    </TreeContext>
  );
}
