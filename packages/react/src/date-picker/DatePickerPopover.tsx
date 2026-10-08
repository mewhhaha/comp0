import { type ComponentProps, type KeyboardEvent } from "react";
import { useDatePickerContext } from "../internal/date-shared.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

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
  // DatePicker provides the popover context together with its own, which the required read guarantees.
  const popover = surface.popover!;
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Calendar";
  }

  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="date-picker-popover"
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
