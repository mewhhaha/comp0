import { type LiHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TimelineItemProps = LiHTMLAttributes<HTMLLIElement>;

export function TimelineItem(props: TimelineItemProps & RefProp<HTMLLIElement>) {
  const { ref } = props;
  return <li {...props} ref={ref} />;
}
