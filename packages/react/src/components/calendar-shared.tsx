import { createContext, useContext } from "react";
import { parseISODate } from "@comp0/core";

export type CalendarContextValue = {
  disabled: boolean;
  /** The date whose grid cell holds the roving tabIndex, as "YYYY-MM-DD". */
  focusedDate: string;
  headerId: string;
  locale: string | undefined;
  max: string | undefined;
  min: string | undefined;
  /** Today's date as "YYYY-MM-DD" for data-today marking. */
  today: string;
  /** The selected date as "YYYY-MM-DD", or "" when nothing is selected. */
  value: string;
  /** The month the grid shows, as "YYYY-MM"; always the focused date's month. */
  visibleMonth: string;
  /** First day of the week, 1 = Monday through 7 = Sunday. */
  weekStart: number;
  /** Moves the roving focus to a clamped date and asks its cell to take DOM focus. */
  focusDate: (iso: string) => void;
  /** Shifts the visible month without stealing DOM focus from the header buttons. */
  moveMonth: (amount: number) => void;
  selectDate: (iso: string) => void;
  /** Consumes a pending keyboard-navigation focus request; only the focused cell asks. */
  takeFocusRequest: () => boolean;
};

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarContext() {
  return useContext(CalendarContext);
}

type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

/** First day of the week (1 = Monday … 7 = Sunday) from Intl.Locale weekInfo, Monday fallback. */
export function resolveWeekStart(locale: string | undefined): number {
  let tag = locale;
  if (!tag && typeof navigator !== "undefined") tag = navigator.language;
  try {
    const resolved = new Intl.Locale(tag ?? "en") as LocaleWithWeekInfo;
    const weekInfo = resolved.getWeekInfo?.() ?? resolved.weekInfo;
    if (weekInfo && weekInfo.firstDay >= 1 && weekInfo.firstDay <= 7) return weekInfo.firstDay;
  } catch {
    // Malformed locale tags fall back to a Monday start below.
  }
  return 1;
}

/** UTC-noon Date for the first day of an ISO month ("YYYY-MM"). */
export function monthStartDate(visibleMonth: string): Date {
  return parseISODate(`${visibleMonth}-01`) ?? new Date();
}

/** Weekday numbers (1 = Monday … 7 = Sunday) in display order for a week start. */
export function weekdayOrder(weekStart: number): number[] {
  return Array.from({ length: 7 }, (_, index) => ((weekStart - 1 + index) % 7) + 1);
}

/** Localized name for a weekday number; 2024-01-01 is a Monday, so day n is Jan n 2024. */
export function weekdayName(
  locale: string | undefined,
  weekday: number,
  width: "narrow" | "long",
): string {
  const date = new Date(Date.UTC(2024, 0, weekday, 12));
  return new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" }).format(date);
}

/** ISO weekday number (1 = Monday … 7 = Sunday) of an ISO date. */
export function isoWeekday(iso: string): number {
  const date = parseISODate(iso);
  if (!date) return 1;
  const day = date.getUTCDay();
  if (day === 0) return 7;
  return day;
}
