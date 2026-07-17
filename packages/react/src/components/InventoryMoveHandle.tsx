import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useInventoryContext, useInventoryItemContext } from "./inventory-shared.js";

export type InventoryMoveHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function InventoryMoveHandle({
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
}: InventoryMoveHandleProps & RefProp<HTMLButtonElement>) {
  const inventory = useInventoryContext("InventoryMoveHandle");
  const item = useInventoryItemContext("InventoryMoveHandle");
  const dragging = inventory.activeValue === item.value && inventory.interaction === "move";

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={props["aria-label"] ?? `Move ${item.label}`}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-dragging={dataAttr(dragging)}
      data-slot={dataSlot(props, "inventory-move-handle")}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented && dragging) {
          inventory.cancelKeyboardInteraction(item.value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (dragging) inventory.commitKeyboardInteraction(item.value);
          else inventory.beginKeyboardInteraction(item.value, item.label, "move");
          return;
        }
        if (event.key === "Escape" && dragging) {
          event.preventDefault();
          inventory.cancelKeyboardInteraction(item.value);
          return;
        }
        inventory.handleKeyboardInteraction(event, item.value, "move");
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled || event.detail !== 0) return;
        if (dragging) inventory.commitKeyboardInteraction(item.value);
        else inventory.beginKeyboardInteraction(item.value, item.label, "move");
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !disabled) {
          inventory.startPointerInteraction(event, item.value, item.label, "move");
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
