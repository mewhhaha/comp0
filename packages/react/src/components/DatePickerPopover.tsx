import { createElement, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "./overlay-shared.js";

export type DatePickerPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

/** Popover surface for the calendar. The default aria-label is the English "Calendar"; pass your own translation. */
export function DatePickerPopover({
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: DatePickerPopoverProps & RefProp<HTMLDivElement>) {
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  if (!popover) throw new Error("DatePickerPopover must be rendered inside Popover.");
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (popover.open && !wasOpen.current) {
      const surface = surfaceRef.current;
      // The roving tab stop marks the calendar cell keyboard focus starts on.
      let target = surface?.querySelector<HTMLElement>("[role='grid'] button[tabindex='0']");
      target = target ?? surface?.querySelector<HTMLElement>("button:not([tabindex='-1'])");
      target?.focus();
    }
    wasOpen.current = popover.open;
  }, [popover.open, surfaceRef]);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Calendar";
  }

  return createElement("div", {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? popover.contentId,
    role: props.role ?? "dialog",
    popover: "auto",
    hidden: !popover.open,
    style: placementSurfaceStyle(placement, offset, popover.triggerId, style),
    "aria-label": ariaLabel,
    "data-open": dataAttr(popover.open),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        popover.requestClose();
      }
    },
  } as never);
}
