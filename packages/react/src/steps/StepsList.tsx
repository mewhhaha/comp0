import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type StepsListProps = ComponentProps<"ol"> & AsProp;

/** Ordered list of steps; the sequence itself is meaningful. */
export function StepsList({ as, ...props }: StepsListProps) {
  const Part = partElement(as, "ol");
  return <Part data-slot="steps-list" {...props} />;
}
