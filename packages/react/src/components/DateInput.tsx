import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
export function DateInput(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} data-slot="date-input" />;
}
