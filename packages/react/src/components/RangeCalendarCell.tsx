import { useEffect, useRef, type ReactNode, type TdHTMLAttributes } from "react";
import { dataAttr, isAfter, isBefore, parseISODate } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCalendarContext } from "./calendar-shared.js";
import { useRangeCalendarContext } from "./date-range-shared.js";

export type RangeCalendarCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "children"> & {
  /** The cell's date as "YYYY-MM-DD". */
  date: string;
  /** Marks a leading or trailing day that belongs to a neighboring month. */
  outsideMonth?: boolean | undefined;
  /** Visible day content; defaults to the day number. */
  children?: ReactNode | undefined;
};

export function RangeCalendarCell({
  date,
  outsideMonth,
  children,
  ref,
  ...props
}: RangeCalendarCellProps & RefProp<HTMLTableCellElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("RangeCalendarCell must be rendered inside RangeCalendar.");
  const rangeCalendar = useRangeCalendarContext("RangeCalendarCell")!;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [start, end] = rangeCalendar.value;
  let previewStart = "";
  let previewEnd = "";
  if (start && !end && rangeCalendar.previewDate && rangeCalendar.previewDate !== start) {
    if (isBefore(rangeCalendar.previewDate, start)) {
      previewStart = rangeCalendar.previewDate;
      previewEnd = start;
    } else {
      previewStart = start;
      previewEnd = rangeCalendar.previewDate;
    }
  }
  const isFocusedDate = date === calendar.focusedDate;
  const rangeStart = Boolean(start && date === start);
  const rangeEnd = Boolean(end && date === end);
  const inRange = Boolean(start && end && isAfter(date, start) && isBefore(date, end));
  const rangePreview = Boolean(
    previewStart && !isBefore(date, previewStart) && !isAfter(date, previewEnd),
  );
  const selected = rangeStart || rangeEnd || inRange;
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
      data-range-start={dataAttr(rangeStart)}
      data-range-end={dataAttr(rangeEnd)}
      data-in-range={dataAttr(inRange)}
      data-range-preview={dataAttr(rangePreview)}
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
        data-range-start={dataAttr(rangeStart)}
        data-range-end={dataAttr(rangeEnd)}
        data-in-range={dataAttr(inRange)}
        data-range-preview={dataAttr(rangePreview)}
        data-today={dataAttr(isToday)}
        onFocus={() => {
          if (!disabled && start && !end) rangeCalendar.setPreviewDate(date);
        }}
        onBlur={() => rangeCalendar.setPreviewDate("")}
        onPointerEnter={() => {
          if (!disabled && start && !end) rangeCalendar.setPreviewDate(date);
        }}
        onPointerLeave={() => rangeCalendar.setPreviewDate("")}
        onClick={() => {
          if (!disabled) calendar.selectDate(date);
        }}
      >
        {children ?? String(Number(date.slice(8)))}
      </button>
    </td>
  );
}
