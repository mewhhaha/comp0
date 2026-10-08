import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type PopoverArrowProps = ComponentProps<"div"> & AsProp;

export function PopoverArrow({ as, ...props }: PopoverArrowProps) {
  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      aria-hidden={props["aria-hidden"] ?? true}
      data-slot={dataSlot(props, "popover-arrow")}
    />
  );
}
