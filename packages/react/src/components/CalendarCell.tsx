import { useEffect, useRef, type ReactNode, type TdHTMLAttributes } from "react";
import { dataAttr, isAfter, isBefore, parseISODate } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCalendarContext } from "./calendar-shared.js";

export type CalendarCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "children"> & {
  /** The cell's date as "YYYY-MM-DD". */
  date: string;
  /** Marks a leading or trailing day that belongs to a neighboring month. */
  outsideMonth?: boolean | undefined;
  /** Visible day content; defaults to the day number. */
  children?: ReactNode | undefined;
};

export function CalendarCell({
  date,
  outsideMonth,
  children,
  ref,
  ...props
}: CalendarCellProps & RefProp<HTMLTableCellElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("CalendarCell must be rendered inside Calendar.");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isFocusedDate = date === calendar.focusedDate;
  const selected = date === calendar.value;
  const isToday = date === calendar.today;
  let disabled = false;
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

  return (
    <td
      {...props}
      ref={ref}
      aria-selected={selected || undefined}
      data-outside-month={dataAttr(Boolean(outsideMonth))}
      data-selected={dataAttr(selected)}
      data-today={dataAttr(isToday)}
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
    </td>
  );
}
