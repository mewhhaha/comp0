import { createElement, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useDateRangePickerContext } from "./date-range-shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "./overlay-shared.js";

export type DateRangePickerPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

/** Popover surface for the range calendar. The default aria-label is the English "Calendar"; pass your own translation. */
export function DateRangePickerPopover({
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: DateRangePickerPopoverProps & RefProp<HTMLDivElement>) {
  useDateRangePickerContext("DateRangePickerPopover");
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const composedRef = useComposedRefs(surfaceRef, ref);
  if (!popover) {
    throw new Error("DateRangePickerPopover must be rendered inside DateRangePicker.");
  }
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (popover.open && !wasOpen.current) {
      const surface = surfaceRef.current;
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
    ref: composedRef,
    id: props.id ?? popover.contentId,
    role: props.role ?? "dialog",
    popover: "auto",
    hidden: !popover.open,
    style: placementSurfaceStyle(placement, offset, popover.triggerId, style),
    "aria-label": ariaLabel,
    "data-open": dataAttr(popover.open),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
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
