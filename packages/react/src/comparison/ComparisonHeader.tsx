import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ComparisonHeaderProps = ComponentProps<"thead"> & AsProp;

/** The head section; holds the row of option headers. */
export function ComparisonHeader({ as, ...props }: ComparisonHeaderProps) {
  const Part = partElement(as, "thead");
  return <Part data-slot="comparison-header" {...props} />;
}
