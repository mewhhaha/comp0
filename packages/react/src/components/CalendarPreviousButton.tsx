import { type ButtonHTMLAttributes } from "react";
import { addDays, isBefore } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarPreviousButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shifts the calendar back one month. The default aria-label is the English "Previous month"; pass your own translation. */
export function CalendarPreviousButton({
  children,
  disabled,
  onClick,
  ref,
  ...props
}: CalendarPreviousButtonProps & RefProp<HTMLButtonElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("CalendarPreviousButton must be rendered inside Calendar.");
  // The previous month is unreachable when even its last day sits before min.
  const previousMonthEnd = addDays(`${calendar.visibleMonth}-01`, -1);
  const resolvedDisabled = Boolean(
    disabled || calendar.disabled || (calendar.min && isBefore(previousMonthEnd, calendar.min)),
  );

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      aria-label={props["aria-label"] ?? "Previous month"}
      disabled={resolvedDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) calendar.moveMonth(-1);
      }}
    >
      {children ?? "‹"}
    </button>
  );
}
