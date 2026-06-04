import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { MenubarContext, MenubarMenuContext } from "./menubar-shared.js";
import { type MenubarContentProps } from "./menubar-shared.js";
export type { MenubarContentProps } from "./menubar-shared.js";

export function MenubarContent({
  hidden,
  onKeyDown,
  ref,
  ...props
}: MenubarContentProps & RefProp<HTMLDivElement>) {
  const menubar = useContext(MenubarContext);
  const menu = useContext(MenubarMenuContext);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const selectedRef = useRef("");
  const [mounted, setMounted] = useState(false);
  const open = Boolean(menu && menubar?.openKey === menu.id);
  const context = useMemo<SelectableCollectionContextValue>(
    () => ({
      activeKey: selectedRef.current,
      selectedKey: selectedRef.current,
      setActiveKey(key) {
        selectedRef.current = key;
      },
      setSelectedKey(key) {
        selectedRef.current = key;
      },
      close() {
        menubar?.close();
        if (menu) menubar?.focusTrigger(menu.id);
      },
      register(key, textValue, element, disabled) {
        if (element) itemMap.current.set(key, { key, textValue, element, disabled });
        else itemMap.current.delete(key);
      },
      items() {
        return sortItems([...itemMap.current.values()]);
      },
    }),
    [menubar, menu],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    context
      .items()
      .find((item) => !item.disabled)
      ?.element?.focus();
  }, [context, open]);

  const content = (
    <MenuContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        id={props.id ?? menu?.contentId}
        role="menu"
        aria-labelledby={menu?.triggerId}
        hidden={hidden ?? !open}
        data-open={open ? "" : undefined}
        data-slot={dataSlot(props, "menubar-content")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            event.preventDefault();
            context.close?.();
            return;
          }

          if ((event.key === "ArrowRight" || event.key === "ArrowLeft") && menu && menubar) {
            const targetKey = getRovingFocusTarget(menubar.items(), menu.id, event.key, {
              orientation: menubar.orientation,
              loop: true,
            });
            if (targetKey) {
              event.preventDefault();
              menubar.close();
              menubar.focusItem(targetKey);
            }
            return;
          }

          const items = context.items();
          const current =
            document.activeElement instanceof HTMLElement ? document.activeElement.id : undefined;
          const key =
            getRovingFocusTarget(items, current, event.key, {
              orientation: "vertical",
              loop: true,
            }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, current) : undefined);
          if (!key) return;
          event.preventDefault();
          context.setActiveKey(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      />
    </MenuContext.Provider>
  );

  if (!mounted || typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
