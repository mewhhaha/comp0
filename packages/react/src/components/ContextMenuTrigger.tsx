import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { ContextMenuContext } from "./context-menu-shared.js";
import { type ContextMenuTriggerProps } from "./context-menu-shared.js";
export type { ContextMenuTriggerProps } from "./context-menu-shared.js";

export function ContextMenuTrigger({
  onContextMenu,
  onKeyDown,
  ref,
  ...props
}: ContextMenuTriggerProps & RefProp<HTMLButtonElement>) {
  const contextMenu = useContext(ContextMenuContext);
  const triggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      contextMenu?.setTriggerElement(element);
      composeRefs(ref)(element);
    },
    [contextMenu, ref],
  );

  return (
    <button
      {...props}
      ref={triggerRef}
      id={props.id ?? contextMenu?.triggerId}
      type={props.type ?? "button"}
      tabIndex={props.tabIndex ?? 0}
      aria-haspopup="menu"
      aria-expanded={contextMenu?.open}
      aria-controls={contextMenu?.contentId}
      data-open={dataAttr(contextMenu?.open)}
      data-slot={dataSlot(props, "context-menu-trigger")}
      onContextMenu={(event) => {
        onContextMenu?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        contextMenu?.openAt(event.clientX, event.clientY);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        contextMenu?.openAt(rect.left, rect.bottom);
      }}
    />
  );
}
