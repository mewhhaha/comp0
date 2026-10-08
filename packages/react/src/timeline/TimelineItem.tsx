import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TimelineItemProps = ComponentProps<"li"> & AsProp;

export function TimelineItem({ as, ...props }: TimelineItemProps) {
  const Part = partElement(as, "li");
  return <Part {...props} />;
}
