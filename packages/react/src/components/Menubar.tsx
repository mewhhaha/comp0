import { useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { getRovingFocusTarget } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";
import { MenubarContext, type MenubarContextValue } from "./menubar-shared.js";

export type MenubarProps = HTMLAttributes<HTMLDivElement>;

/**
 * APG menubar: a horizontal bar of Menu components whose triggers become the
 * bar's menu items. The bar shares one tab stop, ArrowLeft and ArrowRight
 * move between items with wrapping, and while a menu is open the openness
 * follows focus to its neighbors. Name it with aria-label (or
 * aria-labelledby) after the application area it commands.
 */
export function Menubar({
  onFocus,
  onKeyDown,
  ref,
  ...props
}: MenubarProps & RefProp<HTMLDivElement>) {
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const menuMap = useRef(new Map<string, { open: boolean; setOpen: (open: boolean) => void }>());
  const tabStopKey = useRef("");

  const items = () => sortItems([...itemMap.current.values()]);

  const syncTabStops = (nextKey?: string) => {
    const all = items();
    let active = all.find((item) => item.key === (nextKey ?? tabStopKey.current));
    if (!active || active.disabled) active = all.find((item) => !item.disabled);
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
    register(key, textValue, element, disabled) {
      if (element) itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
      else itemMap.current.delete(key);
    },
    items,
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
      const targetKey = getRovingFocusTarget(items(), currentKey, eventKey, {
        orientation: "horizontal",
        loop: true,
      });
      if (!targetKey || targetKey === currentKey) return false;
      syncTabStops(targetKey);
      itemMap.current.get(targetKey)?.element?.focus();
      if (options?.open) menuMap.current.get(targetKey)?.setOpen(true);
      return true;
    },
  };

  return (
    <MenubarContext value={context}>
      <InteractiveDiv
        {...props}
        ref={ref}
        role={props.role ?? "menubar"}
        onFocus={(event) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
          if (!target || target === event.currentTarget) return;
          const item = items().find(
            (candidate) => candidate.element === target || candidate.element?.contains(target),
          );
          if (item && item.key !== tabStopKey.current) syncTabStops(item.key);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.Element ? event.target : null;
          // Keys inside an open menu belong to that menu's popover.
          if (!target || target.closest("[role='menu']")) return;
          const current = items().find(
            (item) => item.element === target || item.element?.contains(target),
          );
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
