import { createElement } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  usePopoverSurface,
  useTooltipContext,
  type OverlayContentProps,
} from "./overlay-shared.js";
export type TooltipPopoverProps = OverlayContentProps;

export function TooltipPopover({
  as,
  hidden,
  onToggle,
  ref,
  ...props
}: TooltipPopoverProps & RefProp<HTMLDivElement>) {
  const tooltip = useTooltipContext();
  // Manual mode keeps the tooltip in the top layer without light dismiss;
  // the trigger's hover and focus handlers own the open state.
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("manual");
  const Content = as ?? "div";
  return createElement(Content, {
    ...props,
    anchor: tooltip?.triggerId,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? tooltip?.contentId,
    role: props.role ?? "tooltip",
    popover: "manual",
    hidden: hidden ?? !tooltip?.open,
    "data-open": dataAttr(tooltip?.open),
    "data-slot": dataSlot(props, "tooltip-content"),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
  } as never);
}
