import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
export function CalendarGridHeader(
  props: HTMLAttributes<HTMLTableSectionElement> & RefProp<HTMLTableSectionElement>,
) {
  const { ref } = props;
  return <thead {...props} ref={ref} data-slot="calendar-grid-header" />;
}
