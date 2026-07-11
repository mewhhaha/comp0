import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { composeRefs, findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { useMenuRootContext, type MenuPopoverProps } from "./menu-shared.js";
import { usePopoverSurface } from "./overlay-shared.js";

export type { MenuPopoverProps } from "./menu-shared.js";

export function MenuPopover({
  ref,
  onKeyDown,
  onToggle,
  onBlur,
  children,
  ...props
}: MenuPopoverProps & RefProp<HTMLDivElement>) {
  const menu = useMenuRootContext();
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const activeKey = useRef("");
  const wasOpen = useRef(false);
  const context = useMemo<SelectableCollectionContextValue>(
    () => ({
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
        if (element)
          itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
        else itemMap.current.delete(key);
      },
      items() {
        return sortItems([...itemMap.current.values()]);
      },
    }),
    [menu],
  );
  const focusItem = useCallback(
    (key: string) => {
      const item = context.items().find((candidate) => candidate.key === key);
      if (!item) return;
      context.setActiveKey(key);
      item.element?.focus();
    },
    [context],
  );

  useLayoutEffect(() => {
    if (menu?.open && !wasOpen.current) {
      const firstItem = context.items().find((item) => !item.disabled);
      if (firstItem) focusItem(firstItem.key);
    }
    wasOpen.current = Boolean(menu?.open);
  }, [context, focusItem, menu?.open]);

  return (
    <MenuContext.Provider value={context}>
      <div
        {...props}
        {...{ anchor: menu?.triggerId }}
        ref={composeRefs(surfaceRef, ref)}
        id={props.id ?? menu?.contentId}
        role={props.role ?? "menu"}
        popover="auto"
        hidden={!menu?.open}
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
          // A submenu follows focus: leaving its surface and trigger, for
          // example by hovering a different parent item, closes it.
          if (!menu?.isSubmenu || !menu.open) return;
          const next = event.relatedTarget;
          if (next instanceof Node) {
            if (event.currentTarget.contains(next)) return;
            const trigger = event.currentTarget.ownerDocument.getElementById(menu.triggerId);
            if (trigger?.contains(next)) return;
          }
          menu.setOpen(false);
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
          const key =
            getRovingFocusTarget(items, current, event.key, {
              orientation: "vertical",
              loop: true,
            }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, current) : undefined);
          if (!key) return;
          event.preventDefault();
          focusItem(key);
        }}
      >
        {children}
      </div>
    </MenuContext.Provider>
  );
}
