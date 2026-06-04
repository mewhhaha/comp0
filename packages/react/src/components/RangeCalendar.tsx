import { useCallback, useContext, useState, type KeyboardEvent } from "react";
import { useControllableState } from "@comp0/core";
import { InteractiveDiv, PickerRootContext, type RefProp } from "../shared.js";
import {
  isoDate,
  parseDate,
  addDays,
  addMonths,
  CalendarGridView,
  dateInRange,
  DateRangeValueContext,
} from "./date-time-shared.js";
import { type DateRangeValue, type RangeCalendarProps } from "./date-time-shared.js";
export type { RangeCalendarProps } from "./date-time-shared.js";
export function RangeCalendar({
  value,
  defaultValue,
  onChange,
  focusedValue,
  isDateDisabled,
  isDateUnavailable,
  children,
  onKeyDown,
  ref,
  ...props
}: RangeCalendarProps & RefProp<HTMLDivElement>) {
  const dateRangePicker = useContext(DateRangeValueContext);
  const picker = useContext(PickerRootContext);
  const controlledValue = value ?? dateRangePicker?.value;
  const handleChange = useCallback(
    (next: DateRangeValue) => {
      dateRangePicker?.setValue(next);
      onChange?.(next);
      if (dateRangePicker && next.start && next.end) picker?.setOpen(false);
    },
    [dateRangePicker, onChange, picker],
  );
  const [range, setRange] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? { start: "", end: "" },
    onChange: handleChange,
  });
  const [focused, setFocused] = useState(
    parseDate(focusedValue) ?? parseDate(range.start) ?? new Date(),
  );
  const select = (next: string) => {
    if (!range.start || range.end || next < range.start) setRange({ start: next, end: "" });
    else setRange({ start: range.start, end: next });
  };
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, next: Date) => {
    event.preventDefault();
    setFocused(next);
  };

  return (
    <InteractiveDiv
      {...props}
      ref={ref}
      role={props.role ?? "group"}
      data-slot="range-calendar"
      data-start-value={range.start || undefined}
      data-end-value={range.end || undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowRight") moveFocus(event, addDays(focused, 1));
        else if (event.key === "ArrowLeft") moveFocus(event, addDays(focused, -1));
        else if (event.key === "ArrowDown") moveFocus(event, addDays(focused, 7));
        else if (event.key === "ArrowUp") moveFocus(event, addDays(focused, -7));
        else if (event.key === "PageDown") moveFocus(event, addMonths(focused, 1));
        else if (event.key === "PageUp") moveFocus(event, addMonths(focused, -1));
        else if (event.key === "Home") moveFocus(event, addDays(focused, -focused.getDay()));
        else if (event.key === "End") moveFocus(event, addDays(focused, 6 - focused.getDay()));
        else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const next = isoDate(focused);
          if (!isDateDisabled?.(next) && !isDateUnavailable?.(next)) select(next);
        }
      }}
    >
      {children ?? (
        <CalendarGridView
          focused={focused}
          isSelected={(next) => dateInRange(next, range)}
          isDateDisabled={isDateDisabled}
          isDateUnavailable={isDateUnavailable}
          select={select}
          focus={setFocused}
        />
      )}
    </InteractiveDiv>
  );
}
