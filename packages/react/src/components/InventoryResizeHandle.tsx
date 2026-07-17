import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useInventoryContext, useInventoryItemContext } from "./inventory-shared.js";

export type InventoryResizeHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function InventoryResizeHandle({
  disabled,
  onBlur,
  onClick,
  onKeyDown,
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
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-resizing={dataAttr(resizing)}
      data-slot={dataSlot(props, "inventory-resize-handle")}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented && resizing) {
          inventory.cancelKeyboardInteraction(item.value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (resizing) inventory.commitKeyboardInteraction(item.value);
          else inventory.beginKeyboardInteraction(item.value, item.label, "resize");
          return;
        }
        if (event.key === "Escape" && resizing) {
          event.preventDefault();
          inventory.cancelKeyboardInteraction(item.value);
          return;
        }
        inventory.handleKeyboardInteraction(event, item.value, "resize");
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled || event.detail !== 0) return;
        if (resizing) inventory.commitKeyboardInteraction(item.value);
        else inventory.beginKeyboardInteraction(item.value, item.label, "resize");
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
