/**
 * Pure ISO calendar-date helpers. Every public value is a "YYYY-MM-DD"
 * string; Date objects only appear internally, pinned to UTC noon so
 * daylight-saving transitions can never skip or repeat a calendar day.
 */

/** One cell of a month matrix: an ISO date plus whether it belongs to a neighboring month. */
export type MonthMatrixCell = {
  iso: string;
  outsideMonth: boolean;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** The number of days in a one-based month of a given year. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

/** Parses "YYYY-MM-DD" into a UTC-noon Date, or null for malformed or impossible dates. */
export function parseISODate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** Formats a Date's UTC calendar day as "YYYY-MM-DD". */
export function formatISODate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whether a string is a real "YYYY-MM-DD" calendar date. */
export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

/** Today's date in the runtime's local timezone as "YYYY-MM-DD". */
export function todayISODate(): string {
  const now = new Date();
  return formatISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12)));
}

/** Adds days to an ISO date; UTC-noon arithmetic keeps DST from shifting the day. */
export function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  date.setUTCDate(date.getUTCDate() + amount);
  return formatISODate(date);
}

/** Adds months to an ISO date, clamping the day to the target month's end (Jan 31 + 1 month is Feb 29 in a leap year). */
export function addMonths(iso: string, amount: number): string {
  const date = parseISODate(iso);
  if (!date) return iso;
  const monthIndex = date.getUTCMonth() + amount;
  const year = date.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = (((monthIndex % 12) + 12) % 12) + 1;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month));
  return formatISODate(new Date(Date.UTC(year, month - 1, day, 12)));
}

/** Whether ISO date a falls strictly before b. */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/** Whether ISO date a falls strictly after b. */
export function isAfter(a: string, b: string): boolean {
  return a > b;
}

/** Clamps an ISO date into an inclusive [min, max] range; either bound may be omitted. */
export function clampISODate(
  iso: string,
  min: string | undefined,
  max: string | undefined,
): string {
  if (min && isBefore(iso, min)) return min;
  if (max && isAfter(iso, max)) return max;
  return iso;
}

/**
 * Weeks covering an ISO month ("YYYY-MM"), each exactly seven cells wide.
 * weekStart follows the Intl.Locale weekInfo convention: 1 = Monday through
 * 7 = Sunday. Leading and trailing cells from neighboring months are marked
 * outsideMonth.
 */
export function monthMatrix(isoMonth: string, weekStart: number): MonthMatrixCell[][] {
  const match = ISO_MONTH_PATTERN.exec(isoMonth);
  if (!match) return [];
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return [];
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  // getUTCDay counts 0 = Sunday through 6; weekInfo counts 1 = Monday through 7 = Sunday.
  const firstWeekday = first.getUTCDay() === 0 ? 7 : first.getUTCDay();
  const lead = (firstWeekday - weekStart + 7) % 7;
  const total = daysInMonth(year, month);
  const weekCount = Math.ceil((lead + total) / 7);
  const weeks: MonthMatrixCell[][] = [];
  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    const week: MonthMatrixCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const offset = weekIndex * 7 + dayIndex - lead;
      const date = new Date(Date.UTC(year, month - 1, 1 + offset, 12));
      week.push({ iso: formatISODate(date), outsideMonth: date.getUTCMonth() !== month - 1 });
    }
    weeks.push(week);
  }
  return weeks;
}
