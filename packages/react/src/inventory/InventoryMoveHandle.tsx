import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useInventoryHandle } from "./use-inventory-handle.js";

export type InventoryMoveHandleProps = ComponentProps<"button"> & AsProp;

export function InventoryMoveHandle({
  as,
  disabled,
  onBlur,
  onClick,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: InventoryMoveHandleProps) {
  const handle = useInventoryHandle("InventoryMoveHandle", "move", {
    disabled,
    onBlur,
    onClick,
    onKeyDown,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="inventory-move-handle"
      {...props}
      {...handle.eventProps}
      type="button"
      aria-label={props["aria-label"] ?? `Move ${handle.label}`}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-dragging={dataAttr(handle.active)}
    />
  );
}
