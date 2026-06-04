import { useMemo, useRef, useState } from "react";
import { findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { MenubarContext, sortMenubarItems } from "./menubar-shared.js";
import { type MenubarItemRecord, type MenubarProps } from "./menubar-shared.js";
export type { MenubarProps } from "./menubar-shared.js";

export function Menubar({
  orientation = "horizontal",
  loop = true,
  onKeyDown,
  ref,
  ...props
}: MenubarProps & RefProp<HTMLDivElement>) {
  const itemMap = useRef(new Map<string, MenubarItemRecord>());
  const [activeKey, setActiveKey] = useState("");
  const [openKey, setOpenKey] = useState("");

  const context = useMemo(
    () => ({
      activeKey,
      openKey,
      orientation,
      setActiveKey,
      setOpenKey,
      close() {
        setOpenKey("");
      },
      registerItem(item: MenubarItemRecord) {
        if (item.element) itemMap.current.set(item.key, item);
        else itemMap.current.delete(item.key);
      },
      unregisterItem(key: string) {
        itemMap.current.delete(key);
      },
      items() {
        return sortMenubarItems([...itemMap.current.values()]);
      },
      focusItem(key: string) {
        const item = itemMap.current.get(key);
        if (!item || item.disabled) return;
        setActiveKey(key);
        item.element?.focus();
      },
      focusTrigger(key: string) {
        const item = itemMap.current.get(key);
        if (!item) return;
        setActiveKey(key);
        item.element?.focus();
      },
    }),
    [activeKey, openKey, orientation],
  );

  return (
    <MenubarContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role="menubar"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-slot={dataSlot(props, "menubar")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target;
          const items = context.items();
          const current = items.find((item) => item.element === target);
          if (!current) return;

          let targetKey = getRovingFocusTarget(items, current.key, event.key, {
            orientation,
            loop,
          });
          if (!targetKey && event.key.length === 1) {
            targetKey = findTypeaheadMatch(items, event.key, current.key);
          }

          if (targetKey) {
            event.preventDefault();
            context.close();
            context.focusItem(targetKey);
            return;
          }

          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && current.hasPopup) {
            event.preventDefault();
            setOpenKey(current.key);
            return;
          }

          if ((event.key === "Enter" || event.key === " ") && current.hasPopup) {
            event.preventDefault();
            setOpenKey(current.key);
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            context.close();
          }
        }}
      />
    </MenubarContext.Provider>
  );
}
