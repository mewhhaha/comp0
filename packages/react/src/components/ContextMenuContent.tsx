import { useContext, useEffect, useMemo, useRef } from "react";
import { composeRefs, findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { ContextMenuContext } from "./context-menu-shared.js";
import { type ContextMenuContentProps } from "./context-menu-shared.js";
export type { ContextMenuContentProps } from "./context-menu-shared.js";

export function ContextMenuContent({
  hidden,
  onKeyDown,
  style,
  ref,
  ...props
}: ContextMenuContentProps & RefProp<HTMLDivElement>) {
  const contextMenu = useContext(ContextMenuContext);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const selectedRef = useRef("");
  const open = Boolean(contextMenu?.open);
  const menuContext = useMemo<SelectableCollectionContextValue>(
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
        contextMenu?.setOpen(false);
        contextMenu?.focusTrigger();
      },
      register(key, textValue, element, disabled) {
        if (element) itemMap.current.set(key, { key, textValue, element, disabled });
        else itemMap.current.delete(key);
      },
      items() {
        return sortItems([...itemMap.current.values()]);
      },
    }),
    [contextMenu],
  );

  useEffect(() => {
    if (!open) return;
    menuContext
      .items()
      .find((item) => !item.disabled)
      ?.element?.focus();
  }, [menuContext, open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const trigger = document.getElementById(contextMenu?.triggerId ?? "");
      if (contentRef.current?.contains(event.target)) return;
      if (trigger?.contains(event.target)) return;
      contextMenu?.setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [contextMenu, open]);

  return (
    <MenuContext.Provider value={menuContext}>
      <div
        {...props}
        ref={composeRefs(contentRef, ref)}
        id={props.id ?? contextMenu?.contentId}
        role="menu"
        aria-labelledby={contextMenu?.triggerId}
        hidden={hidden ?? !open}
        data-open={open ? "" : undefined}
        data-slot={dataSlot(props, "context-menu-content")}
        style={{
          position: contextMenu?.x === undefined ? style?.position : "fixed",
          left: contextMenu?.x,
          top: contextMenu?.y,
          ...style,
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            event.preventDefault();
            menuContext.close?.();
            return;
          }

          const items = menuContext.items();
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
          menuContext.setActiveKey(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      />
    </MenuContext.Provider>
  );
}
