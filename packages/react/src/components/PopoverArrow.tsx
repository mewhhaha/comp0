import { createElement } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { type OverlayContentProps } from "./overlay-shared.js";

export type PopoverArrowProps = OverlayContentProps;

export function PopoverArrow({ as, ref, ...props }: PopoverArrowProps & RefProp<HTMLDivElement>) {
  return createElement(as ?? "div", {
    ...props,
    ref,
    "aria-hidden": props["aria-hidden"] ?? true,
    "data-slot": dataSlot(props, "popover-arrow"),
  });
}
