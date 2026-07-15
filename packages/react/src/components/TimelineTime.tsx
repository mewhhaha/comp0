import { type TimeHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TimelineTimeProps = TimeHTMLAttributes<HTMLTimeElement>;

export function TimelineTime(props: TimelineTimeProps & RefProp<HTMLTimeElement>) {
  const { ref } = props;
  return <time {...props} ref={ref} />;
}
