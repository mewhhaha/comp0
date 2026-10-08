import { type ComponentProps, type KeyboardEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useDateRangePickerContext } from "./date-range-shared.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";

export type DateRangePickerPopoverProps = ComponentProps<"div"> & PopoverPlacementProps & AsProp;

/** Popover surface for the range calendar. The default aria-label is the English "Calendar"; pass your own translation. */
export function DateRangePickerPopover({
  as,
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: DateRangePickerPopoverProps) {
  useDateRangePickerContext("DateRangePickerPopover");
  const surface = useOverlaySurface<HTMLDivElement>({
    popover: "auto",
    id: props.id,
    offset,
    onToggle,
    placement,
    ref,
    style,
    // The roving tab stop marks the calendar cell keyboard focus starts on.
    initialFocus: ["[role='grid'] button[tabindex='0']", "button:not([tabindex='-1'])"],
  });
  // DateRangePicker provides the popover context together with its own, which the required read guarantees.
  const popover = surface.popover!;
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Calendar";
  }

  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="date-range-picker-popover"
      {...props}
      {...surface.props}
      role={props.role ?? "dialog"}
      aria-label={ariaLabel}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
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
