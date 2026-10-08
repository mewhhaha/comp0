import { useEffect, useRef, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { isAfter, isBefore, parseISODate } from "../internal/date.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCalendarContext } from "../calendar/calendar-shared.js";
import { useRangeCalendarContext } from "../date-range-picker/date-range-shared.js";

export type RangeCalendarCellProps = ComponentProps<"td"> &
  AsProp & {
    /** The cell's date as "YYYY-MM-DD". */
    date: string;
    /** Marks a leading or trailing day that belongs to a neighboring month. */
    outsideMonth?: boolean | undefined;
  };

/** A day cell. Its children are the visible day content and default to the day number. */
export function RangeCalendarCell({
  as,
  date,
  outsideMonth,
  children,
  ...props
}: RangeCalendarCellProps) {
  const rangeCalendar = useRangeCalendarContext("RangeCalendarCell");
  const calendar = useCalendarContext("RangeCalendarCell");
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

  const Part = partElement(as, "td");
  return (
    <Part
      data-slot="range-calendar-cell"
      {...props}
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
    </Part>
  );
}
