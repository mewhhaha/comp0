import { type ReactNode } from "react";
import { type MonthMatrixCell } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { CalendarGrid, type CalendarGridProps } from "./CalendarGrid.js";
import { RangeCalendarCell } from "./RangeCalendarCell.js";
import { useRangeCalendarContext } from "./date-range-shared.js";

export type RangeCalendarGridProps = Omit<CalendarGridProps, "children"> & {
  /** Custom day cell renderer, called for each matrix cell in row order. */
  children?: ((cell: MonthMatrixCell) => ReactNode) | undefined;
};

export function RangeCalendarGrid({
  children,
  ref,
  ...props
}: RangeCalendarGridProps & RefProp<HTMLTableElement>) {
  useRangeCalendarContext("RangeCalendarGrid");
  const renderCell =
    children ??
    ((cell: MonthMatrixCell) => (
      <RangeCalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />
    ));

  return (
    <CalendarGrid {...props} ref={ref} aria-multiselectable={props["aria-multiselectable"] ?? true}>
      {renderCell}
    </CalendarGrid>
  );
}
