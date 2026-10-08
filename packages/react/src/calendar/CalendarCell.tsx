import { useEffect, useRef, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { isAfter, isBefore, parseISODate } from "../internal/date.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarCellProps = ComponentProps<"td"> &
  AsProp & {
    /** The cell's date as "YYYY-MM-DD". */
    date: string;
    /** Marks a leading or trailing day that belongs to a neighboring month. */
    outsideMonth?: boolean | undefined;
  };

/** A day cell. Its children are the visible day content and default to the day number. */
export function CalendarCell({ as, date, outsideMonth, children, ...props }: CalendarCellProps) {
  const calendar = useCalendarContext("CalendarCell");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isFocusedDate = date === calendar.focusedDate;
  const selected = date === calendar.value;
  const isToday = date === calendar.today;
  let disabled = calendar.disabled;
  if (calendar.min && isBefore(date, calendar.min)) disabled = true;
  if (calendar.max && isAfter(date, calendar.max)) disabled = true;
  const parsed = parseISODate(date);
  let label = date;
  if (parsed) {
    label = new Intl.DateTimeFormat(calendar.locale, {
      dateStyle: "full",
      timeZone: "UTC",
    }).format(parsed);
  }
  // Keyboard navigation re-renders the grid before focus can move; the newly
  // focused cell claims the pending request once it exists in the DOM.
  useEffect(() => {
    if (isFocusedDate && calendar.takeFocusRequest()) buttonRef.current?.focus();
  });

  let tabIndex = -1;
  if (isFocusedDate) tabIndex = 0;

  const Part = partElement(as, "td");
  return (
    <Part
      data-slot="calendar-cell"
      {...props}
      aria-selected={selected || undefined}
      data-outside-month={dataAttr(Boolean(outsideMonth))}
      data-selected={dataAttr(selected)}
      data-today={dataAttr(isToday)}
      data-disabled={dataAttr(disabled)}
      data-value={date}
    >
      <button
        type="button"
        ref={buttonRef}
        tabIndex={tabIndex}
        disabled={disabled}
        aria-label={label}
        data-outside-month={dataAttr(Boolean(outsideMonth))}
        data-selected={dataAttr(selected)}
        data-today={dataAttr(isToday)}
        onClick={() => {
          if (!disabled) calendar.selectDate(date);
        }}
      >
        {children ?? String(Number(date.slice(8)))}
      </button>
    </Part>
  );
}
