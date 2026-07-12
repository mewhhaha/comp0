import { useLayoutEffect, useRef } from "react";
import {
  composeRefs,
  findTypeaheadMatch,
  getRovingFocusTarget,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { useMenuRootContext, type MenuPopoverProps } from "./menu-shared.js";
import { placementSurfaceStyle, usePopoverSurface } from "./overlay-shared.js";

export type { MenuPopoverProps } from "./menu-shared.js";

export function MenuPopover({
  ref,
  offset,
  onKeyDown,
  onToggle,
  onBlur,
  placement,
  style,
  children,
  ...props
}: MenuPopoverProps & RefProp<HTMLDivElement>) {
  const menu = useMenuRootContext();
  const typeaheadSearch = useTypeaheadSearch();
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const activeKey = useRef("");
  const wasOpen = useRef(false);
  const context: SelectableCollectionContextValue = {
    activeKey: activeKey.current,
    selectedKey: "",
    setActiveKey(key) {
      activeKey.current = key;
    },
    setSelectedKey() {},
    close() {
      menu?.closeAll();
    },
    register(key, textValue, element, disabled) {
      if (element) itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
      else itemMap.current.delete(key);
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };
  const focusItem = (key: string) => {
    const item = context.items().find((candidate) => candidate.key === key);
    if (!item) return;
    context.setActiveKey(key);
    item.element?.focus();
  };

  useLayoutEffect(() => {
    if (menu?.open && !wasOpen.current) {
      const items = sortItems([...itemMap.current.values()]);
      const firstItem = items.find((item) => !item.disabled);
      if (firstItem) {
        activeKey.current = firstItem.key;
        firstItem.element?.focus();
      }
    }
    wasOpen.current = Boolean(menu?.open);
  }, [menu?.open]);

  return (
    <MenuContext value={context}>
      <div
        {...props}
        ref={composeRefs(surfaceRef, ref)}
        id={props.id ?? menu?.contentId}
        role={props.role ?? "menu"}
        popover="auto"
        hidden={!menu?.open}
        style={placementSurfaceStyle(placement, offset, menu?.triggerId, style)}
        data-open={menu?.open || undefined}
        aria-labelledby={props["aria-labelledby"] ?? menu?.triggerId}
        onToggle={(event) => {
          onToggle?.(event);
          // Toggle events from nested popovers bubble in the React tree;
          // only this surface's own toggles drive its state.
          if (event.target !== event.currentTarget) return;
          if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
        }}
        onBlur={(event) => {
          onBlur?.(event);
          // The menu follows focus: a submenu closes when focus moves to a
          // different parent item, and any menu closes when focus tabs out
          // of the popover and its trigger entirely.
          if (!menu?.open) return;
          const next = event.relatedTarget;
          if (next instanceof Node) {
            if (event.currentTarget.contains(next)) return;
            const trigger = event.currentTarget.ownerDocument.getElementById(menu.triggerId);
            if (trigger?.contains(next)) return;
            menu.setOpen(false);
            return;
          }
          // Without a focus destination only a submenu follows the blur, so
          // pointer light dismiss keeps handling the root menu.
          if (menu.isSubmenu) menu.setOpen(false);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Events inside a nested submenu belong to that submenu's popover.
          const targetMenu =
            event.target instanceof Element ? event.target.closest("[role='menu']") : null;
          if (targetMenu !== event.currentTarget) return;
          if (menu?.isSubmenu && event.key === "ArrowLeft") {
            event.preventDefault();
            menu.setOpen(false);
            menu.focusTrigger();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            menu?.setOpen(false);
            menu?.focusTrigger();
            return;
          }
          const items = context.items();
          const activeElement =
            document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
          const current = items.find((item) => item.element === activeElement)?.key;
          let key = getRovingFocusTarget(items, current, event.key, {
            orientation: "vertical",
            loop: true,
          });
          if (!key && event.key.length === 1) {
            key = findTypeaheadMatch(items, typeaheadSearch(event.key), current);
          }
          if (!key) return;
          event.preventDefault();
          focusItem(key);
        }}
      >
        {children}
      </div>
    </MenuContext>
  );
}
