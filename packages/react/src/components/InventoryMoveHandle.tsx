import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useInventoryContext, useInventoryItemContext } from "./inventory-shared.js";

export type InventoryMoveHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function InventoryMoveHandle({
  disabled,
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
  const invalidPlacement = inventory.invalidValue === item.value;

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={props["aria-label"] ?? `Move ${item.label}`}
      aria-keyshortcuts={props["aria-keyshortcuts"] ?? "ArrowLeft ArrowRight ArrowUp ArrowDown"}
      data-dragging={dataAttr(dragging)}
      data-invalid-placement={dataAttr(invalidPlacement)}
      data-slot={dataSlot(props, "inventory-move-handle")}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && !disabled) {
          inventory.handleKeyboardInteraction(event, item.value, item.label, "move");
        }
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
