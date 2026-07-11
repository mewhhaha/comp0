import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { composeRefs, findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { useMenuRootContext, type MenuContentProps } from "./menu-shared.js";
import { usePopoverSurface } from "./overlay-shared.js";

export type { MenuContentProps } from "./menu-shared.js";

export function MenuContent({
  ref,
  onKeyDown,
  onToggle,
  children,
  ...props
}: MenuContentProps & RefProp<HTMLDivElement>) {
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
        menu?.setOpen(false);
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
          if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
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
