import { type ButtonHTMLAttributes } from "react";
import { addMonths, isAfter } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarNextButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shifts the calendar forward one month. The default aria-label is the English "Next month"; pass your own translation. */
export function CalendarNextButton({
  children,
  disabled,
  onClick,
  ref,
  ...props
}: CalendarNextButtonProps & RefProp<HTMLButtonElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("CalendarNextButton must be rendered inside Calendar.");
  // The next month is unreachable when even its first day sits past max.
  const nextMonthStart = addMonths(`${calendar.visibleMonth}-01`, 1);
  const resolvedDisabled = Boolean(
    disabled || calendar.disabled || (calendar.max && isAfter(nextMonthStart, calendar.max)),
  );

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      aria-label={props["aria-label"] ?? "Next month"}
      disabled={resolvedDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) calendar.moveMonth(1);
      }}
    >
      {children ?? "›"}
    </button>
  );
}
