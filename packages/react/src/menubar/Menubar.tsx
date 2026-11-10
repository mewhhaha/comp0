import { useRef, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { composeRefs, useCollection, useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  NO_SELECTION,
  rootEntryKey,
  useRootTabIndex,
  useTabStopStore,
} from "../internal/tab-stop.js";
import { MenubarContext, type MenubarContextValue, type MenubarItem } from "./menubar-shared.js";
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
  const collection = useCollection<MenubarItem>();
  const navigate = useCollectionNavigation();
  const menubarRef = useRef<HTMLElement | null>(null);
  // The stop follows the item that last held focus and is remembered after focus leaves, so
  // Tab returns there. It lives outside React state: an arrow press re-renders only the two
  // triggers whose tabIndex changes, not every trigger reading this context (bench:
  // collection-tab-stop.bench.tsx, PERFORMANCE.md).
  const tabStops = useTabStopStore(collection);
  const rootTabIndex = useRootTabIndex(tabStops);

  const context: MenubarContextValue = {
    collection,
    tabStops,
    isAnyOpen() {
      return collection.items().some((item) => item.open);
    },
    closeOthers(key) {
      for (const item of collection.items()) {
        if (item.key !== key && item.open) item.setOpen(false);
      }
    },
    moveFocus(currentKey, eventKey, options) {
      const targetKey = navigate(eventKey, collection.items(), currentKey, {
        orientation: "horizontal",
        dir: menubarRef.current ? writingDirection(menubarRef.current) : "ltr",
        loop: true,
        typeahead: false,
      });
      if (!targetKey || targetKey === currentKey) return false;
      tabStops.focus(targetKey, NO_SELECTION);
      collection.get(targetKey)?.element?.focus();
      if (options?.open) collection.get(targetKey)?.setOpen(true);
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
        tabIndex={props.tabIndex ?? rootTabIndex}
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
          if (item && !item.disabled) tabStops.focus(item.key, NO_SELECTION);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.Element ? event.target : null;
          // Keys inside an open menu belong to that menu's popover.
          if (!target || target.closest("[role='menu']")) return;
          if (target === event.currentTarget) {
            // Focus is on the bar itself (focused before its triggers registered, or by a
            // click between triggers): enter at the stop.
            const entry = navigate(event.key, collection.items(), undefined, {
              orientation: "horizontal",
              dir: writingDirection(event.currentTarget),
              typeahead: false,
            });
            const entryKey = rootEntryKey(event.key, tabStops.get(NO_SELECTION), entry);
            if (!entryKey) return;
            event.preventDefault();
            tabStops.focus(entryKey, NO_SELECTION);
            collection.get(entryKey)?.element?.focus();
            return;
          }
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
