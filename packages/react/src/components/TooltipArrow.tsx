import { createElement } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { type OverlayContentProps } from "./overlay-shared.js";

export type TooltipArrowProps = OverlayContentProps;

/** Decorative caret rendered inside TooltipPopover; position and paint it with CSS so it points at the trigger. */
export function TooltipArrow({ as, ref, ...props }: TooltipArrowProps & RefProp<HTMLDivElement>) {
  return createElement(as ?? "div", {
    ...props,
    ref,
    "aria-hidden": props["aria-hidden"] ?? true,
    "data-slot": dataSlot(props, "tooltip-arrow"),
  });
}
