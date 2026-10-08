import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { useDatePickerContext } from "../internal/date-shared.js";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";

export type DatePickerPopoverProps = ComponentProps<"div"> & PopoverPlacementProps & AsProp;

/** Popover surface for the calendar. The default aria-label is the English "Calendar"; pass your own translation. */
export function DatePickerPopover({
  as,
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: DatePickerPopoverProps) {
  useDatePickerContext("DatePickerPopover");
  const {
    onNativeToggle,
    popover: surfacePopover,
    surfaceRef,
  } = usePopoverSurface<HTMLDivElement>("auto");
  // DatePicker provides the popover context together with its own, which the required read guarantees.
  const popover = surfacePopover!;
  const composedRef = useComposedRefs(surfaceRef, ref);
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

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={props.id ?? popover.contentId}
      role={props.role ?? "dialog"}
      popover="auto"
      hidden={!popover.open}
      style={placementSurfaceStyle(placement, offset, popover.triggerId, style)}
      aria-label={ariaLabel}
      data-slot={dataSlot(props, "date-picker-popover")}
      data-open={dataAttr(popover.open)}
      onToggle={(event: React.ToggleEvent<HTMLDivElement>) => {
        onToggle?.(event);
        // Toggle events from nested popovers bubble in the React tree; only
        // this surface's own toggles drive its state.
        if (event.target !== event.currentTarget) return;
        if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
          event.preventDefault();
          popover.requestClose();
        }
      }}
    />
  );
}
