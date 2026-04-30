import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export function Group(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}
