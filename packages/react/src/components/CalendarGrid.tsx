import { Fragment, type ReactNode, type TableHTMLAttributes } from "react";
import { addDays, addMonths, monthMatrix, type MonthMatrixCell } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { CalendarCell } from "./CalendarCell.js";
import { isoWeekday, useCalendarContext, weekdayName, weekdayOrder } from "./calendar-shared.js";

export type CalendarGridProps = Omit<TableHTMLAttributes<HTMLTableElement>, "children"> & {
  /** Custom day cell renderer, called for each matrix cell in row order. */
  children?: ((cell: MonthMatrixCell) => ReactNode) | undefined;
};

export function CalendarGrid({
  children,
  onKeyDown,
  ref,
  ...props
}: CalendarGridProps & RefProp<HTMLTableElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("CalendarGrid must be rendered inside Calendar.");
  const weeks = monthMatrix(calendar.visibleMonth, calendar.weekStart);
  const renderCell =
    children ??
    ((cell: MonthMatrixCell) => <CalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />);
  let labelledBy = props["aria-labelledby"];
  if (labelledBy === undefined && props["aria-label"] === undefined) {
    labelledBy = calendar.headerId;
  }

  return (
    <table
      {...props}
      ref={ref}
      role="grid"
      aria-labelledby={labelledBy}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const { focusedDate } = calendar;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          calendar.selectDate(focusedDate);
          return;
        }
        // APG grid pattern for dates: arrows move by day and week, Home/End
        // travel the visible week, PageUp/PageDown shift a month (a year with
        // Shift); focus crossing the month edge shifts the visible month.
        const offsetFromWeekStart = (isoWeekday(focusedDate) - calendar.weekStart + 7) % 7;
        let next: string | undefined;
        if (event.key === "ArrowRight") next = addDays(focusedDate, 1);
        else if (event.key === "ArrowLeft") next = addDays(focusedDate, -1);
        else if (event.key === "ArrowDown") next = addDays(focusedDate, 7);
        else if (event.key === "ArrowUp") next = addDays(focusedDate, -7);
        else if (event.key === "Home") next = addDays(focusedDate, -offsetFromWeekStart);
        else if (event.key === "End") next = addDays(focusedDate, 6 - offsetFromWeekStart);
        else if (event.key === "PageUp") next = addMonths(focusedDate, event.shiftKey ? -12 : -1);
        else if (event.key === "PageDown") next = addMonths(focusedDate, event.shiftKey ? 12 : 1);
        if (!next) return;
        event.preventDefault();
        calendar.focusDate(next);
      }}
    >
      <thead>
        <tr>
          {weekdayOrder(calendar.weekStart).map((weekday) => (
            <th
              key={weekday}
              scope="col"
              abbr={weekdayName(calendar.locale, weekday, "long")}
              aria-label={weekdayName(calendar.locale, weekday, "long")}
            >
              {weekdayName(calendar.locale, weekday, "narrow")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]?.iso}>
            {week.map((cell) => (
              <Fragment key={cell.iso}>{renderCell(cell)}</Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
