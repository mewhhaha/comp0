import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TimelineProps = ComponentProps<"ol"> & AsProp;

/** A chronological sequence rendered as a native ordered list. */
export function Timeline({ as, ...props }: TimelineProps) {
  const Part = partElement(as, "ol");
  return <Part {...props} />;
}
