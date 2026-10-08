import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import {
  addMonths,
  clampISODate,
  isBefore,
  isValidISODate,
  todayISODate,
} from "../internal/date.js";
import { CalendarContext, resolveWeekStart } from "../calendar/calendar-shared.js";
import {
  RangeCalendarContext,
  useOptionalDateRangePickerContext,
  type DateRange,
} from "../date-range-picker/date-range-shared.js";
import { usePopoverContext } from "../internal/overlay/index.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";

export type { DateRange } from "../date-range-picker/date-range-shared.js";

export type RangeCalendarProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  /** The selected [start, end] dates as "YYYY-MM-DD" strings. An empty end is an incomplete range. */
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  /** Receives the selected [start, end] ISO dates rather than a native ChangeEvent. */
  onChange?: ((value: DateRange) => void) | undefined;
  /** Earliest selectable date as "YYYY-MM-DD". */
  min?: string | undefined;
  /** Latest selectable date as "YYYY-MM-DD". */
  max?: string | undefined;
  /** BCP 47 tag for month and weekday names; defaults to the browser locale. */
  locale?: string | undefined;
  disabled?: boolean | undefined;
}>;

export function RangeCalendar({
  as,
  children,
  id,
  value,
  defaultValue,
  onChange,
  min,
  max,
  locale,
  disabled,
  ...props
}: RangeCalendarProps) {
  const generatedId = useId();
  const picker = useOptionalDateRangePickerContext();
  const popover = usePopoverContext();
  const resolvedDisabled = Boolean(disabled || picker?.disabled);
  const [ownValue, setOwnValue] = useControllableState<DateRange>({
    value,
    defaultValue: defaultValue ?? ["", ""],
    onChange,
  });
  const adoptsPicker =
    picker !== null && value === undefined && defaultValue === undefined && onChange === undefined;
  let range = ownValue;
  if (adoptsPicker && picker) range = picker.value;
  const [start, end] = range;
  const today = todayISODate();
  const [focusedDate, setFocusedDate] = useState(() => {
    let initial = today;
    if (isValidISODate(end)) initial = end;
    else if (isValidISODate(start)) initial = start;
    return clampISODate(initial, min, max);
  });
  const [previewDate, setPreviewDate] = useState("");
  const focusRequested = useRef(false);

  useEffect(() => {
    if (isValidISODate(end)) {
      setFocusedDate(clampISODate(end, min, max));
      return;
    }
    if (isValidISODate(start)) {
      setFocusedDate(clampISODate(start, min, max));
      return;
    }
    setFocusedDate((current) => clampISODate(current, min, max));
  }, [end, start, min, max]);

  const setRange = (next: DateRange) => {
    if (adoptsPicker && picker) {
      picker.setValue(next);
      return;
    }
    setOwnValue(next);
  };
  const selectDate = (iso: string) => {
    if (resolvedDisabled) return;
    setPreviewDate("");
    let next: DateRange = [iso, ""];
    if (start && !end) {
      if (isBefore(iso, start)) next = [iso, start];
      else next = [start, iso];
    }
    setRange(next);
    setFocusedDate(clampISODate(iso, min, max));
    if (next[1] && picker && popover) popover.requestClose();
  };
  const focusDate = (iso: string) => {
    if (resolvedDisabled) return;
    const next = clampISODate(iso, min, max);
    if (next === focusedDate) return;
    focusRequested.current = true;
    setFocusedDate(next);
  };
  const moveMonth = (amount: number) => {
    if (resolvedDisabled) return;
    setFocusedDate(clampISODate(addMonths(focusedDate, amount), min, max));
  };
  const takeFocusRequest = () => {
    const requested = focusRequested.current;
    focusRequested.current = false;
    return requested;
  };
  const calendarContext = {
    disabled: resolvedDisabled,
    focusedDate,
    headerId: `${id ?? generatedId}-range-calendar-header`,
    locale,
    max,
    min,
    today,
    value: end || start,
    visibleMonth: focusedDate.slice(0, 7),
    weekStart: resolveWeekStart(locale),
    focusDate,
    moveMonth,
    selectDate,
    takeFocusRequest,
  };

  const Root = rootElement(as);
  return (
    <CalendarContext value={calendarContext}>
      <RangeCalendarContext value={{ previewDate, value: range, setPreviewDate }}>
        <Root
          data-slot="range-calendar"
          {...props}
          id={id}
          data-disabled={dataAttr(resolvedDisabled)}
          data-complete={dataAttr(Boolean(start && end))}
          data-start-value={start || undefined}
          data-end-value={end || undefined}
        >
          {children}
        </Root>
      </RangeCalendarContext>
    </CalendarContext>
  );
}
