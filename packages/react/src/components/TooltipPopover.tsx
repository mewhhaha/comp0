import { createElement } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  useTooltipContext,
  type OverlayContentProps,
  type PopoverPlacementProps,
} from "./overlay-shared.js";
export type TooltipPopoverProps = OverlayContentProps & PopoverPlacementProps;

export function TooltipPopover({
  as,
  hidden,
  offset,
  onPointerEnter,
  onPointerLeave,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: TooltipPopoverProps & RefProp<HTMLDivElement>) {
  const tooltip = useTooltipContext();
  // Manual mode keeps the tooltip in the top layer without light dismiss;
  // the trigger's hover and focus handlers own the open state.
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("manual");
  const composedRef = useComposedRefs(surfaceRef, ref);
  const Content = as ?? "div";
  return createElement(Content, {
    ...props,
    ref: composedRef,
    id: props.id ?? tooltip?.contentId,
    role: props.role ?? "tooltip",
    popover: "manual",
    hidden: hidden ?? !tooltip?.open,
    style: placementSurfaceStyle(placement, offset, tooltip?.triggerId, style),
    "data-open": dataAttr(tooltip?.open),
    "data-slot": dataSlot(props, "tooltip-content"),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
    // Hovering the content keeps the tooltip open (WCAG 1.4.13).
    onPointerEnter(event: React.PointerEvent<HTMLDivElement>) {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) tooltip?.cancelClose();
    },
    onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) tooltip?.scheduleClose();
    },
  } as never);
}
