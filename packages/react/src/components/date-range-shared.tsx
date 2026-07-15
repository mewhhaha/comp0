import { createContext, useContext } from "react";

export type DateRange = [start: string, end: string];

export type DateRangePickerContextValue = {
  value: DateRange;
  startFieldId: string;
  endFieldId: string;
  disabled: boolean;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
  setValue: (value: DateRange) => void;
};

export const DateRangePickerContext = createContext<DateRangePickerContextValue | null>(null);

export function useDateRangePickerContext(part?: string) {
  const context = useContext(DateRangePickerContext);
  if (!context && part) throw new Error(`${part} must be rendered inside DateRangePicker.`);
  return context;
}

export type RangeCalendarContextValue = {
  value: DateRange;
};

export const RangeCalendarContext = createContext<RangeCalendarContextValue | null>(null);

export function useRangeCalendarContext(part?: string) {
  const context = useContext(RangeCalendarContext);
  if (!context && part) throw new Error(`${part} must be rendered inside RangeCalendar.`);
  return context;
}
