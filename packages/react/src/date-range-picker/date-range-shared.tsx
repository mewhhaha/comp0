import { createRequiredContext } from "../internal/context.js";

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

export const [
  DateRangePickerContext,
  useDateRangePickerContext,
  useOptionalDateRangePickerContext,
] = createRequiredContext<DateRangePickerContextValue>("DateRangePicker");

export type RangeCalendarContextValue = {
  value: DateRange;
  previewDate: string;
  setPreviewDate: (value: string) => void;
};

export const [RangeCalendarContext, useRangeCalendarContext] =
  createRequiredContext<RangeCalendarContextValue>("RangeCalendar");
