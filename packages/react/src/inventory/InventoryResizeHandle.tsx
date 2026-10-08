import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useInventoryHandle } from "./use-inventory-handle.js";

export type InventoryResizeHandleProps = ComponentProps<"button"> & AsProp;

export function InventoryResizeHandle({
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
}: InventoryResizeHandleProps) {
  const handle = useInventoryHandle("InventoryResizeHandle", "resize", {
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
      data-slot="inventory-resize-handle"
      {...props}
      {...handle.eventProps}
      type="button"
      aria-label={props["aria-label"] ?? `Resize ${handle.label}`}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-resizing={dataAttr(handle.active)}
    />
  );
}
