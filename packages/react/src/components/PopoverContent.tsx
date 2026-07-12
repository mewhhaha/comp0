import { createElement } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverContentProps,
} from "./overlay-shared.js";
export type {
  PopoverContentProps,
  PopoverPlacement,
  PopoverPlacementProps,
} from "./overlay-shared.js";

export function PopoverContent({
  as,
  hidden,
  offset,
  onKeyDown,
  onToggle,
  placement,
  popover: popoverProp = "auto",
  ref,
  style,
  ...props
}: PopoverContentProps & RefProp<HTMLDivElement>) {
  // Top layer by default, matching SelectPopover; pass popover="none" to
  // render in normal flow instead.
  const popoverMode = popoverProp === "none" ? undefined : popoverProp;
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>(popoverMode);
  const Content = as ?? "div";

  return createElement(Content, {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? popover?.contentId,
    role: props.role ?? "dialog",
    popover: popoverMode,
    hidden: hidden ?? !popover?.open,
    style: placementSurfaceStyle(placement, offset, popover?.triggerId, style),
    "data-open": dataAttr(popover?.open),
    "data-slot": dataSlot(props, "popover-content"),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      if (event.target !== event.currentTarget) return;
      if (event.defaultPrevented) return;
      onNativeToggle(event.newState === "open");
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape") return;
      event.preventDefault();
      popover?.requestClose();
    },
  });
}
