import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type TooltipArrowProps = ComponentProps<"div"> & AsProp;

/** Decorative caret rendered inside TooltipContent; position and paint it with CSS so it points at the trigger. */
export function TooltipArrow({ as, ...props }: TooltipArrowProps) {
  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      aria-hidden={props["aria-hidden"] ?? true}
      data-slot={dataSlot(props, "tooltip-arrow")}
    />
  );
}
