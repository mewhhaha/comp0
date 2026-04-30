import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFieldIds } from "./field.js";
import { InteractiveDiv, PickerRootContext, type RefProp } from "./shared.js";

export type DateValue = string;
export type TimeValue = string;
export type DateRangeValue = { start: string; end: string };

const pad = (value: number) => String(value).padStart(2, "0");
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value: string | undefined) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
};
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);
const startOfMonthGrid = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return addDays(first, -first.getDay());
};

interface DateFieldContextValue {
  value: string;
  kind: "date" | "time";
  setPart: (part: DateSegmentPart, next: number) => void;
}

const DateFieldContext = createContext<DateFieldContextValue | null>(null);

type DateSegmentPart = "year" | "month" | "day" | "hour" | "minute" | "second" | "literal";

function segmentValue(value: string, kind: "date" | "time", part: DateSegmentPart) {
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

function clampPart(part: DateSegmentPart, value: number) {
  if (part === "year") return Math.max(1, Math.min(9999, value));
  if (part === "month") return Math.max(1, Math.min(12, value));
  if (part === "day") return Math.max(1, Math.min(31, value));
  if (part === "hour") return Math.max(0, Math.min(23, value));
  if (part === "minute" || part === "second") return Math.max(0, Math.min(59, value));
  return value;
}

function partBounds(part: DateSegmentPart) {
  if (part === "year") return { min: 1, max: 9999 };
  if (part === "month") return { min: 1, max: 12 };
  if (part === "day") return { min: 1, max: 31 };
  if (part === "hour") return { min: 0, max: 23 };
  if (part === "minute" || part === "second") return { min: 0, max: 59 };
  return undefined;
}

function nextValue(current: string, kind: "date" | "time", part: DateSegmentPart, next: number) {
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

function DateFieldRoot(
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

export function DateField(props: DateFieldProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return DateFieldRoot("date", props, ref);
}
export function TimeField(props: DateFieldProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return DateFieldRoot("time", props, ref);
}

export function DateInput(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} data-slot="date-input" />;
}

export type DateSegmentProps = HTMLAttributes<HTMLDivElement> & {
  part?: DateSegmentPart | undefined;
};

export function DateSegment({
  part = "literal",
  children,
  onKeyDown,
  ref,
  ...props
}: DateSegmentProps & RefProp<HTMLDivElement>) {
  const field = useContext(DateFieldContext);
  const numeric = part !== "literal";
  const value = field ? segmentValue(field.value, field.kind, part) : "";
  const numberValue = Number(value);
  const bounds = partBounds(part);

  if (!numeric) {
    return (
      <div
        {...props}
        ref={ref}
        data-placeholder={dataAttr(!field)}
        data-slot="date-segment"
        data-type={part}
      >
        {children ?? value}
      </div>
    );
  }

  return (
    <InteractiveDiv
      {...props}
      ref={ref}
      role="spinbutton"
      tabIndex={props.tabIndex ?? 0}
      aria-valuemin={bounds?.min}
      aria-valuemax={bounds?.max}
      aria-valuenow={numberValue}
      aria-valuetext={value}
      data-placeholder={dataAttr(!field)}
      data-slot="date-segment"
      data-type={part}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !field) return;
        let delta = 0;
        if (event.key === "ArrowUp") delta = 1;
        else if (event.key === "ArrowDown") delta = -1;
        if (!delta) return;
        event.preventDefault();
        field.setPart(part, numberValue + delta);
      }}
    >
      {children ?? value}
    </InteractiveDiv>
  );
}

export type CalendarProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: DateValue | undefined;
  defaultValue?: DateValue | undefined;
  onChange?: (value: DateValue) => void;
  focusedValue?: DateValue | undefined;
  isDateDisabled?: ((date: DateValue) => boolean) | undefined;
  isDateUnavailable?: ((date: DateValue) => boolean) | undefined;
};

function CalendarGridView({
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
                <CalendarCell
                  key={value}
                  date={value}
                  selected={isSelected(value)}
                  disabled={disabled}
                  tabIndex={isoDate(focused) === value ? 0 : -1}
                  onFocus={() => focus(date)}
                  onClick={() => {
                    if (!disabled) select(value);
                  }}
                >
                  {date.getDate()}
                </CalendarCell>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Calendar({
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
}: CalendarProps & RefProp<HTMLDivElement>) {
  const datePicker = useContext(DateValueContext);
  const picker = useContext(PickerRootContext);
  const controlledValue = value ?? datePicker?.value;
  const handleChange = useCallback(
    (next: string) => {
      datePicker?.setValue(next);
      onChange?.(next);
      if (datePicker) picker?.setOpen(false);
    },
    [datePicker, onChange, picker],
  );
  const [selected, setSelected] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? "",
    onChange: handleChange,
  });
  const [focused, setFocused] = useState(
    parseDate(focusedValue) ?? parseDate(selected) ?? new Date(),
  );
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, next: Date) => {
    event.preventDefault();
    setFocused(next);
  };

  return (
    <InteractiveDiv
      {...props}
      ref={ref}
      role={props.role ?? "group"}
      data-slot="calendar"
      data-value={selected || undefined}
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
          if (!isDateDisabled?.(next) && !isDateUnavailable?.(next)) setSelected(next);
        }
      }}
    >
      {children ?? (
        <CalendarGridView
          focused={focused}
          isSelected={(value) => selected === value}
          isDateDisabled={isDateDisabled}
          isDateUnavailable={isDateUnavailable}
          select={setSelected}
          focus={setFocused}
        />
      )}
    </InteractiveDiv>
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

function dateInRange(value: string, range: DateRangeValue) {
  if (!range.start || !range.end) return value === range.start || value === range.end;
  return value >= range.start && value <= range.end;
}

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

export function CalendarGrid(props: HTMLAttributes<HTMLTableElement> & RefProp<HTMLTableElement>) {
  const { ref } = props;
  return <table {...props} ref={ref} role={props.role ?? "grid"} data-slot="calendar-grid" />;
}
export function CalendarGridHeader(
  props: HTMLAttributes<HTMLTableSectionElement> & RefProp<HTMLTableSectionElement>,
) {
  const { ref } = props;
  return <thead {...props} ref={ref} data-slot="calendar-grid-header" />;
}
export function CalendarGridBody(
  props: HTMLAttributes<HTMLTableSectionElement> & RefProp<HTMLTableSectionElement>,
) {
  const { ref } = props;
  return <tbody {...props} ref={ref} data-slot="calendar-grid-body" />;
}
export function CalendarHeaderCell(
  props: HTMLAttributes<HTMLTableCellElement> & RefProp<HTMLTableCellElement>,
) {
  const { ref } = props;
  return <th {...props} ref={ref} scope="col" data-slot="calendar-header-cell" />;
}
export type CalendarCellProps = HTMLAttributes<HTMLTableCellElement> & {
  date?: DateValue | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
};
export function CalendarCell({
  selected,
  disabled,
  date,
  ref,
  ...props
}: CalendarCellProps & RefProp<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      ref={ref}
      role={props.role ?? "gridcell"}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      data-date={date}
      data-disabled={dataAttr(disabled)}
      data-selected={dataAttr(selected)}
      data-slot="calendar-cell"
    />
  );
}

interface DateValueContextValue {
  value: string;
  setValue: (value: string) => void;
}

const DateValueContext = createContext<DateValueContextValue | null>(null);

interface DateRangeValueContextValue {
  value: DateRangeValue;
  setValue: (value: DateRangeValue) => void;
}

const DateRangeValueContext = createContext<DateRangeValueContextValue | null>(null);

export type DatePickerProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: DateValue | undefined;
  defaultValue?: DateValue | undefined;
  onChange?: (value: DateValue) => void;
  name?: string | undefined;
  disabled?: boolean | undefined;
};

export function DatePicker({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  children,
  ref,
  ...props
}: DatePickerProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(props.id);
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [open, setOpen] = useState(false);
  const valueContext = useMemo(
    () => ({ value: current, setValue: setCurrent }),
    [current, setCurrent],
  );
  const pickerContext = useMemo(
    () => ({
      disabled: Boolean(disabled),
      open,
      triggerId: `${ids.controlId}-trigger`,
      popoverId: `${ids.controlId}-popover`,
      setOpen,
    }),
    [disabled, ids.controlId, open],
  );

  return (
    <DateValueContext.Provider value={valueContext}>
      <PickerRootContext.Provider value={pickerContext}>
        <div
          {...props}
          ref={ref}
          role={props.role ?? "group"}
          data-open={dataAttr(open)}
          data-slot="date-picker"
          data-value={current || undefined}
        >
          {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
          {children}
        </div>
      </PickerRootContext.Provider>
    </DateValueContext.Provider>
  );
}

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

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  children,
  ref,
  ...props
}: DateRangePickerProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(props.id);
  const [range, setRange] = useControllableState({
    value,
    defaultValue: defaultValue ?? { start: "", end: "" },
    onChange,
  });
  const [open, setOpen] = useState(false);
  const valueContext = useMemo(() => ({ value: range, setValue: setRange }), [range, setRange]);
  const pickerContext = useMemo(
    () => ({
      disabled: Boolean(disabled),
      open,
      triggerId: `${ids.controlId}-trigger`,
      popoverId: `${ids.controlId}-popover`,
      setOpen,
    }),
    [disabled, ids.controlId, open],
  );
  return (
    <DateRangeValueContext.Provider value={valueContext}>
      <PickerRootContext.Provider value={pickerContext}>
        <div
          {...props}
          ref={ref}
          role={props.role ?? "group"}
          data-open={dataAttr(open)}
          data-slot="date-range-picker"
          data-start-value={range.start || undefined}
          data-end-value={range.end || undefined}
        >
          {name && (
            <>
              <input type="hidden" name={`${name}-start`} value={range.start} disabled={disabled} />
              <input type="hidden" name={`${name}-end`} value={range.end} disabled={disabled} />
            </>
          )}
          {children}
        </div>
      </PickerRootContext.Provider>
    </DateRangeValueContext.Provider>
  );
}
