import { createContext, useContext } from "react";

export type DatePickerContextValue = {
  /** The picker's selected date as "YYYY-MM-DD", or "" when empty. */
  value: string;
  setValue: (iso: string) => void;
  disabled: boolean;
};

export const DatePickerContext = createContext<DatePickerContextValue | null>(null);

export function useDatePickerContext() {
  return useContext(DatePickerContext);
}
