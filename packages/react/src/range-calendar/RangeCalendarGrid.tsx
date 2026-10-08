import { type ReactNode } from "react";
import { type MonthMatrixCell } from "../internal/date.js";
import { CalendarGrid, type CalendarGridProps } from "../calendar/CalendarGrid.js";
import { RangeCalendarCell } from "./RangeCalendarCell.js";
import { useRangeCalendarContext } from "../date-range-picker/date-range-shared.js";

export type RangeCalendarGridProps = Omit<CalendarGridProps, "children"> & {
  /** Custom day cell renderer, called for each matrix cell in row order. */
  children?: ((cell: MonthMatrixCell) => ReactNode) | undefined;
};

export function RangeCalendarGrid({ children, ...props }: RangeCalendarGridProps) {
  useRangeCalendarContext("RangeCalendarGrid");
  const renderCell =
    children ??
    ((cell: MonthMatrixCell) => (
      <RangeCalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />
    ));

  return (
    <CalendarGrid
      data-slot="range-calendar-grid"
      {...props}
      aria-multiselectable={props["aria-multiselectable"] ?? true}
    >
      {renderCell}
    </CalendarGrid>
  );
}
