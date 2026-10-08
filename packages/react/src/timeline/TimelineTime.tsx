import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TimelineTimeProps = ComponentProps<"time"> & AsProp;

export function TimelineTime({ as, ...props }: TimelineTimeProps) {
  const Part = partElement(as, "time");
  return <Part {...props} />;
}
