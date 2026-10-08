import { createRequiredContext } from "./context.js";

type DatePickerContextValue = {
  /** The picker's selected date as "YYYY-MM-DD", or "" when empty. */
  value: string;
  setValue: (iso: string) => void;
  disabled: boolean;
};

export const [DatePickerContext, useDatePickerContext, useOptionalDatePickerContext] =
  createRequiredContext<DatePickerContextValue>("DatePicker");
