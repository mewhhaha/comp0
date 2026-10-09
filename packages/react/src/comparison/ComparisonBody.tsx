import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ComparisonBodyProps = ComponentProps<"tbody"> & AsProp;

/** The body section; holds one row per feature. */
export function ComparisonBody({ as, ...props }: ComparisonBodyProps) {
  const Part = partElement(as, "tbody");
  return <Part data-slot="comparison-body" {...props} />;
}
