import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useInventoryContext, useInventoryItemContext } from "./inventory-shared.js";

export type InventoryResizeHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function InventoryResizeHandle({
  disabled,
  onBlur,
  onKeyDown,
  onKeyUp,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  ...props
}: InventoryResizeHandleProps & RefProp<HTMLButtonElement>) {
  const inventory = useInventoryContext("InventoryResizeHandle");
  const item = useInventoryItemContext("InventoryResizeHandle");
  const resizing = inventory.activeValue === item.value && inventory.interaction === "resize";

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={props["aria-label"] ?? `Resize ${item.label}`}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ??
        "ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown"
      }
      data-resizing={dataAttr(resizing)}
      data-slot={dataSlot(props, "inventory-resize-handle")}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) inventory.finishKeyboardInteraction(item.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && !disabled) {
          inventory.handleKeyboardInteraction(event, item.value, item.label, "resize");
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (!event.defaultPrevented && event.key === "Shift") {
          inventory.finishKeyboardInteraction(item.value);
        }
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !disabled) {
          inventory.startPointerInteraction(event, item.value, item.label, "resize");
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) inventory.continuePointerInteraction(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (!event.defaultPrevented) inventory.finishPointerInteraction(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        inventory.cancelPointerInteraction(event);
      }}
    />
  );
}
