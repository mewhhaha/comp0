import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
export function CalendarGridBody(
  props: HTMLAttributes<HTMLTableSectionElement> & RefProp<HTMLTableSectionElement>,
) {
  const { ref } = props;
  return <tbody {...props} ref={ref} data-slot="calendar-grid-body" />;
}
