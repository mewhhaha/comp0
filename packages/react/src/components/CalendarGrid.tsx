import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
export function CalendarGrid(props: HTMLAttributes<HTMLTableElement> & RefProp<HTMLTableElement>) {
  const { ref } = props;
  return <table {...props} ref={ref} role={props.role ?? "grid"} data-slot="calendar-grid" />;
}
