import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from "react";
import {
  addMonths,
  clampISODate,
  isValidISODate,
  todayISODate,
  useControllableState,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { CalendarContext, resolveWeekStart } from "./calendar-shared.js";
import { useDatePickerContext } from "./date-shared.js";
import { usePopoverContext } from "./overlay-shared.js";
import { ProviderRoot } from "./provider-root.js";

export type CalendarProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
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
};

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
  ref,
  ...props
}: CalendarProps & RefProp<HTMLElement>) {
  const generatedId = useId();
  const picker = useDatePickerContext();
  const popover = usePopoverContext();
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
    if (!isValidISODate(selected)) return;
    setFocusedDate(clampISODate(selected, min, max));
  }, [selected, min, max]);

  const setValue = (iso: string) => {
    if (adoptsPicker && picker) {
      picker.setValue(iso);
      return;
    }
    setOwnValue(iso);
  };
  const selectDate = (iso: string) => {
    setValue(iso);
    setFocusedDate(clampISODate(iso, min, max));
    if (picker && popover) popover.requestClose();
  };
  const focusDate = (iso: string) => {
    const next = clampISODate(iso, min, max);
    if (next === focusedDate) return;
    focusRequested.current = true;
    setFocusedDate(next);
  };
  const moveMonth = (amount: number) => {
    setFocusedDate(clampISODate(addMonths(focusedDate, amount), min, max));
  };
  const takeFocusRequest = () => {
    const requested = focusRequested.current;
    focusRequested.current = false;
    return requested;
  };
  const context = {
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

  return (
    <CalendarContext value={context}>
      <ProviderRoot as={as} {...props} id={id} ref={ref} data-value={selected || undefined}>
        {children}
      </ProviderRoot>
    </CalendarContext>
  );
}
