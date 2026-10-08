import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  addMonths,
  clampISODate,
  dataAttr,
  isValidISODate,
  todayISODate,
  useControllableState,
} from "@comp0/core";
import { CalendarContext, resolveWeekStart } from "./calendar-shared.js";
import { useOptionalDatePickerContext } from "../internal/date-shared.js";
import { usePopoverContext } from "../internal/overlay/index.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type CalendarProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  /** The selected date as "YYYY-MM-DD". */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected ISO date ("YYYY-MM-DD") rather than a native ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  /** Earliest selectable date as "YYYY-MM-DD". */
  min?: string | undefined;
  /** Latest selectable date as "YYYY-MM-DD". */
  max?: string | undefined;
  /** BCP 47 tag for month and weekday names; defaults to the browser locale. */
  locale?: string | undefined;
  disabled?: boolean | undefined;
}>;

export function Calendar({
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
}: CalendarProps) {
  const generatedId = useId();
  const picker = useOptionalDatePickerContext();
  const popover = usePopoverContext();
  const resolvedDisabled = Boolean(disabled || picker?.disabled);
  const [ownValue, setOwnValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const adoptsPicker =
    picker !== null && value === undefined && defaultValue === undefined && onChange === undefined;
  let selected = ownValue;
  if (adoptsPicker && picker) selected = picker.value;
  const today = todayISODate();
  const [focusedDate, setFocusedDate] = useState(() => {
    let initial = today;
    if (isValidISODate(selected)) initial = selected;
    return clampISODate(initial, min, max);
  });
  const focusRequested = useRef(false);
  // A DateField sharing the picker (or a controlled value prop) can change the
  // selection while the grid is closed or unfocused; follow it so the visible
  // month always contains the selection.
  useEffect(() => {
    if (isValidISODate(selected)) {
      setFocusedDate(clampISODate(selected, min, max));
      return;
    }
    setFocusedDate((current) => clampISODate(current, min, max));
  }, [selected, min, max]);

  const setValue = (iso: string) => {
    if (adoptsPicker && picker) {
      picker.setValue(iso);
      return;
    }
    setOwnValue(iso);
  };
  const selectDate = (iso: string) => {
    if (resolvedDisabled) return;
    setValue(iso);
    setFocusedDate(clampISODate(iso, min, max));
    if (picker && popover) popover.requestClose();
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
  const context = {
    disabled: resolvedDisabled,
    focusedDate,
    headerId: `${id ?? generatedId}-calendar-header`,
    locale,
    max,
    min,
    today,
    value: selected,
    visibleMonth: focusedDate.slice(0, 7),
    weekStart: resolveWeekStart(locale),
    focusDate,
    moveMonth,
    selectDate,
    takeFocusRequest,
  };

  const Root = rootElement(as);
  return (
    <CalendarContext value={context}>
      <Root
        {...props}
        id={id}
        data-slot={dataSlot(props, "calendar")}
        data-disabled={dataAttr(resolvedDisabled)}
        data-value={selected || undefined}
      >
        {children}
      </Root>
    </CalendarContext>
  );
}
