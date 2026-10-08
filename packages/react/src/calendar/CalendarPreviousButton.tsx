import { type ComponentProps, type MouseEvent } from "react";
import { addDays, isBefore } from "../internal/date.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarPreviousButtonProps = ComponentProps<"button"> & AsProp;

/** Shifts the calendar back one month. The default aria-label is the English "Previous month"; pass your own translation. */
export function CalendarPreviousButton({
  as,
  children,
  disabled,
  onClick,
  ...props
}: CalendarPreviousButtonProps) {
  const calendar = useCalendarContext("CalendarPreviousButton");
  const isNativeButton = as === undefined || as === "button";
  // The previous month is unreachable when even its last day sits before min.
  const previousMonthEnd = addDays(`${calendar.visibleMonth}-01`, -1);
  const resolvedDisabled = Boolean(
    disabled || calendar.disabled || (calendar.min && isBefore(previousMonthEnd, calendar.min)),
  );

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="calendar-previous-button"
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-label={props["aria-label"] ?? "Previous month"}
      disabled={resolvedDisabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) calendar.moveMonth(-1);
      }}
    >
      {children ?? "‹"}
    </Part>
  );
}
