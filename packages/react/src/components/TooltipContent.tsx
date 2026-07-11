import { createElement } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useTooltipContext, type OverlayContentProps } from "./overlay-shared.js";
export type TooltipContentProps = OverlayContentProps;

export function TooltipContent({
  as,
  hidden,
  ref,
  ...props
}: TooltipContentProps & RefProp<HTMLDivElement>) {
  const tooltip = useTooltipContext();
  const Content = as ?? "div";
  return createElement(Content, {
    ...props,
    ref,
    id: props.id ?? tooltip?.contentId,
    role: props.role ?? "tooltip",
    hidden: hidden ?? !tooltip?.open,
    "data-open": dataAttr(tooltip?.open),
    "data-slot": dataSlot(props, "tooltip-content"),
  });
}
