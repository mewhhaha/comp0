import { type ComponentProps, type MouseEvent } from "react";
import { addMonths, isAfter } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarNextButtonProps = ComponentProps<"button"> & AsProp;

/** Shifts the calendar forward one month. The default aria-label is the English "Next month"; pass your own translation. */
export function CalendarNextButton({
  as,
  children,
  disabled,
  onClick,
  ...props
}: CalendarNextButtonProps) {
  const calendar = useCalendarContext("CalendarNextButton");
  const isNativeButton = as === undefined || as === "button";
  // The next month is unreachable when even its first day sits past max.
  const nextMonthStart = addMonths(`${calendar.visibleMonth}-01`, 1);
  const resolvedDisabled = Boolean(
    disabled || calendar.disabled || (calendar.max && isAfter(nextMonthStart, calendar.max)),
  );

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-label={props["aria-label"] ?? "Next month"}
      data-slot={dataSlot(props, "calendar-next-button")}
      disabled={resolvedDisabled}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) calendar.moveMonth(1);
      }}
    >
      {children ?? "›"}
    </Part>
  );
}
