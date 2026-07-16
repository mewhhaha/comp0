import { createElement } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type OverlayContentProps,
  type PopoverPlacementProps,
} from "./overlay-shared.js";
import { usePreviewContext } from "./preview-shared.js";

export type PreviewPopoverProps = OverlayContentProps & PopoverPlacementProps;

export function PreviewPopover({
  as,
  hidden,
  offset,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: PreviewPopoverProps & RefProp<HTMLDivElement>) {
  const preview = usePreviewContext();
  // Manual mode keeps the card in the top layer without light dismiss;
  // the trigger's hover and focus handlers own the open state.
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("manual");
  const composedRef = useComposedRefs(surfaceRef, ref);
  const Content = as ?? "div";
  return createElement(Content, {
    ...props,
    ref: composedRef,
    id: props.id ?? preview?.contentId,
    popover: "manual",
    hidden: hidden ?? !preview?.open,
    style: placementSurfaceStyle(placement, offset, preview?.triggerId, style),
    "data-open": dataAttr(preview?.open),
    "data-slot": dataSlot(props, "preview-content"),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
    // Hovering the card keeps the preview open (WCAG 1.4.13).
    onPointerEnter(event: React.PointerEvent<HTMLDivElement>) {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) preview?.cancelClose();
    },
    onPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) preview?.scheduleClose();
    },
    onFocus(event: React.FocusEvent<HTMLDivElement>) {
      onFocus?.(event);
      if (!event.defaultPrevented) preview?.cancelClose();
    },
    onBlur(event: React.FocusEvent<HTMLDivElement>) {
      onBlur?.(event);
      if (event.defaultPrevented) return;
      // Focus moving between elements inside the card keeps it open; only
      // focus leaving the card schedules the close.
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      preview?.scheduleClose();
    },
  } as never);
}
