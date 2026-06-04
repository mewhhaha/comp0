import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
export function CalendarHeaderCell(
  props: HTMLAttributes<HTMLTableCellElement> & RefProp<HTMLTableCellElement>,
) {
  const { ref } = props;
  return <th {...props} ref={ref} scope="col" data-slot="calendar-header-cell" />;
}
