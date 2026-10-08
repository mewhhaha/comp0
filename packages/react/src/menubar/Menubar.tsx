import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { composeRefs, useCollection, useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { MenubarContext, type MenubarContextValue } from "./menubar-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

export type MenubarProps = ComponentProps<"div"> & AsProp;

/**
 * APG menubar: a horizontal bar of Menu components whose triggers become the
 * bar's menu items. The bar shares one tab stop, ArrowLeft and ArrowRight
 * move between items with wrapping, and while a menu is open the openness
 * follows focus to its neighbors. Name it with aria-label (or
 * aria-labelledby) after the application area it commands.
 */
export function Menubar({ as, onFocus, onKeyDown, ref, ...props }: MenubarProps) {
  const collection = useCollection();
  const navigate = useCollectionNavigation();
  const menuMap = useRef(new Map<string, { open: boolean; setOpen: (open: boolean) => void }>());
  const tabStopKey = useRef("");
  const menubarRef = useRef<HTMLElement | null>(null);

  const syncTabStops = (nextKey?: string) => {
    const all = collection.items();
    let active = collection.get(nextKey ?? tabStopKey.current);
    if (!active || active.disabled) active = collection.enabledItems()[0];
    tabStopKey.current = active?.key ?? "";
    for (const item of all) {
      if (!item.element) continue;
      let tabIndex = -1;
      if (item.key === tabStopKey.current) tabIndex = 0;
      item.element.tabIndex = tabIndex;
    }
  };

  // Keep exactly one tab stop as items mount, unmount, or change state.
  useLayoutEffect(() => {
    syncTabStops();
  });

  const context: MenubarContextValue = {
    register: collection.register,
    collection,
    reportMenu(key, open, setOpen) {
      if (setOpen) menuMap.current.set(key, { open, setOpen });
      else menuMap.current.delete(key);
    },
    isAnyOpen() {
      return [...menuMap.current.values()].some((menu) => menu.open);
    },
    closeOthers(key) {
      for (const [menuKey, menu] of menuMap.current) {
        if (menuKey !== key && menu.open) menu.setOpen(false);
      }
    },
    syncTabStops() {
      syncTabStops();
    },
    moveFocus(currentKey, eventKey, options) {
      const targetKey = navigate(eventKey, collection.items(), currentKey, {
        orientation: "horizontal",
        dir: menubarRef.current ? writingDirection(menubarRef.current) : "ltr",
        loop: true,
        typeahead: false,
      });
      if (!targetKey || targetKey === currentKey) return false;
      syncTabStops(targetKey);
      collection.get(targetKey)?.element?.focus();
      if (options?.open) menuMap.current.get(targetKey)?.setOpen(true);
      return true;
    },
  };

  const Part = partElement(as, "div");
  return (
    <MenubarContext value={context}>
      <Part
        {...props}
        ref={composeRefs(ref, menubarRef)}
        role={props.role ?? "menubar"}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
          if (!target || target === event.currentTarget) return;
          const item = collection
            .items()
            .find(
              (candidate) => candidate.element === target || candidate.element?.contains(target),
            );
          if (item && item.key !== tabStopKey.current) syncTabStops(item.key);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.Element ? event.target : null;
          // Keys inside an open menu belong to that menu's popover.
          if (!target || target.closest("[role='menu']")) return;
          const current = collection
            .items()
            .find((item) => item.element === target || item.element?.contains(target));
          if (!current) return;
          // Open follows focus: moving while a menu is open opens the neighbor.
          const handled = context.moveFocus(current.key, event.key, {
            open: context.isAnyOpen(),
          });
          if (handled) event.preventDefault();
        }}
      />
    </MenubarContext>
  );
}
