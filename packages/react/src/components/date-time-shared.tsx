import { createContext, useMemo, type HTMLAttributes, type Ref } from "react";
import { dataAttr, useControllableState } from "@comp0/core";

export type DateValue = string;
export type TimeValue = string;
export type DateRangeValue = { start: string; end: string };

export const pad = (value: number) => String(value).padStart(2, "0");
export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const parseDate = (value: string | undefined) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
};
export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);
export const startOfMonthGrid = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return addDays(first, -first.getDay());
};

export interface DateFieldContextValue {
  value: string;
  kind: "date" | "time";
  setPart: (part: DateSegmentPart, next: number) => void;
}

export const DateFieldContext = createContext<DateFieldContextValue | null>(null);

export type DateSegmentPart = "year" | "month" | "day" | "hour" | "minute" | "second" | "literal";

export function segmentValue(value: string, kind: "date" | "time", part: DateSegmentPart) {
  if (part === "literal") return "";
  const [datePart, timePart = ""] = kind === "date" ? [value, ""] : ["", value];
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  const time = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timePart);
  if (part === "year") return date?.[1] ?? "0000";
  if (part === "month") return date?.[2] ?? "01";
  if (part === "day") return date?.[3] ?? "01";
  if (part === "hour") return time?.[1] ?? "00";
  if (part === "minute") return time?.[2] ?? "00";
  return time?.[3] ?? "00";
}

export function clampPart(part: DateSegmentPart, value: number) {
  if (part === "year") return Math.max(1, Math.min(9999, value));
  if (part === "month") return Math.max(1, Math.min(12, value));
  if (part === "day") return Math.max(1, Math.min(31, value));
  if (part === "hour") return Math.max(0, Math.min(23, value));
  if (part === "minute" || part === "second") return Math.max(0, Math.min(59, value));
  return value;
}

export function partBounds(part: DateSegmentPart) {
  if (part === "year") return { min: 1, max: 9999 };
  if (part === "month") return { min: 1, max: 12 };
  if (part === "day") return { min: 1, max: 31 };
  if (part === "hour") return { min: 0, max: 23 };
  if (part === "minute" || part === "second") return { min: 0, max: 59 };
  return undefined;
}

export function nextValue(
  current: string,
  kind: "date" | "time",
  part: DateSegmentPart,
  next: number,
) {
  if (kind === "time") {
    const hour = Number(segmentValue(current, "time", part === "hour" ? part : "hour"));
    const minute = Number(segmentValue(current, "time", part === "minute" ? part : "minute"));
    const second = Number(segmentValue(current, "time", part === "second" ? part : "second"));
    const values = { hour, minute, second, [part]: clampPart(part, next) };
    return `${pad(values.hour)}:${pad(values.minute)}:${pad(values.second)}`;
  }
  const year = Number(segmentValue(current, "date", part === "year" ? part : "year"));
  const month = Number(segmentValue(current, "date", part === "month" ? part : "month"));
  const day = Number(segmentValue(current, "date", part === "day" ? part : "day"));
  const values = { year, month, day, [part]: clampPart(part, next) };
  return `${String(values.year).padStart(4, "0")}-${pad(values.month)}-${pad(values.day)}`;
}

export type DateFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: DateValue | undefined;
  defaultValue?: DateValue | undefined;
  onChange?: (value: DateValue) => void;
  name?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
};

export function DateFieldRoot(
  kind: "date" | "time",
  { value, defaultValue, onChange, name, disabled, invalid, children, ...props }: DateFieldProps,
  ref: Ref<HTMLDivElement> | undefined,
) {
  const fallback = kind === "date" ? isoDate(new Date()) : "00:00:00";
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? fallback,
    onChange,
  });
  const context = useMemo(
    () => ({
      value: current,
      kind,
      setPart(part: DateSegmentPart, next: number) {
        setCurrent((old) => nextValue(old, kind, part, next));
      },
    }),
    [current, kind, setCurrent],
  );

  return (
    <DateFieldContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role={props.role ?? "group"}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        data-disabled={dataAttr(disabled)}
        data-invalid={dataAttr(invalid)}
        data-slot={kind === "date" ? "date-field" : "time-field"}
        data-value={current}
      >
        {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
        {children}
      </div>
    </DateFieldContext.Provider>
  );
}

export type DateSegmentProps = HTMLAttributes<HTMLDivElement> & {
  part?: DateSegmentPart | undefined;
};

export type CalendarProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: DateValue | undefined;
  defaultValue?: DateValue | undefined;
  onChange?: (value: DateValue) => void;
  focusedValue?: DateValue | undefined;
  isDateDisabled?: ((date: DateValue) => boolean) | undefined;
  isDateUnavailable?: ((date: DateValue) => boolean) | undefined;
};

export function CalendarGridView({
  focused,
  isSelected,
  isDateDisabled,
  isDateUnavailable,
  select,
  focus,
}: {
  focused: Date;
  isSelected: (value: string) => boolean;
  isDateDisabled?: ((date: string) => boolean) | undefined;
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  select: (value: string) => void;
  focus: (date: Date) => void;
}) {
  const start = startOfMonthGrid(focused);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  return (
    <table role="grid" data-slot="calendar-grid">
      <thead data-slot="calendar-grid-header">
        <tr>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <th key={day} scope="col" data-slot="calendar-header-cell">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody data-slot="calendar-grid-body">
        {Array.from({ length: 6 }, (_, row) => (
          <tr key={row}>
            {days.slice(row * 7, row * 7 + 7).map((date) => {
              const value = isoDate(date);
              const disabled = isDateDisabled?.(value) || isDateUnavailable?.(value);
              return (
                <td
                  key={value}
                  role="gridcell"
                  aria-selected={isSelected(value) || undefined}
                  aria-disabled={disabled || undefined}
                  data-date={value}
                  data-disabled={dataAttr(disabled)}
                  data-selected={dataAttr(isSelected(value))}
                  data-slot="calendar-cell"
                  tabIndex={isoDate(focused) === value ? 0 : -1}
                  onFocus={() => focus(date)}
                  onClick={() => {
                    if (!disabled) select(value);
                  }}
                >
                  {date.getDate()}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type RangeCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> & {
  value?: DateRangeValue | undefined;
  defaultValue?: DateRangeValue | undefined;
  onChange?: (value: DateRangeValue) => void;
  focusedValue?: DateValue | undefined;
  isDateDisabled?: ((date: DateValue) => boolean) | undefined;
  isDateUnavailable?: ((date: DateValue) => boolean) | undefined;
};

export function dateInRange(value: string, range: DateRangeValue) {
  if (!range.start || !range.end) return value === range.start || value === range.end;
  return value >= range.start && value <= range.end;
}

export type CalendarCellProps = HTMLAttributes<HTMLTableCellElement> & {
  date?: DateValue | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
};
export interface DateValueContextValue {
  value: string;
  setValue: (value: string) => void;
}

export const DateValueContext = createContext<DateValueContextValue | null>(null);

export interface DateRangeValueContextValue {
  value: DateRangeValue;
  setValue: (value: DateRangeValue) => void;
}

export const DateRangeValueContext = createContext<DateRangeValueContextValue | null>(null);

export type DatePickerProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: DateValue | undefined;
  defaultValue?: DateValue | undefined;
  onChange?: (value: DateValue) => void;
  name?: string | undefined;
  disabled?: boolean | undefined;
};

export type DateRangePickerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> & {
  value?: DateRangeValue | undefined;
  defaultValue?: DateRangeValue | undefined;
  onChange?: (value: DateRangeValue) => void;
  name?: string | undefined;
  disabled?: boolean | undefined;
};
