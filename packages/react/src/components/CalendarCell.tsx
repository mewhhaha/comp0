import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type CalendarCellProps } from "./date-time-shared.js";
export type { CalendarCellProps } from "./date-time-shared.js";
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
