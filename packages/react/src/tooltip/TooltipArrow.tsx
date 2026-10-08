import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TooltipArrowProps = ComponentProps<"div"> & AsProp;

/** Decorative caret rendered inside TooltipContent; position and paint it with CSS so it points at the trigger. */
export function TooltipArrow({ as, ...props }: TooltipArrowProps) {
  const Part = partElement(as, "div");
  return <Part data-slot="tooltip-arrow" {...props} aria-hidden={props["aria-hidden"] ?? true} />;
}
