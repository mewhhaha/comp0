import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ErrorSummaryListProps = ComponentProps<"ul"> & AsProp;

export function ErrorSummaryList({ as, ...props }: ErrorSummaryListProps) {
  const Part = partElement(as, "ul");
  return <Part data-slot="error-summary-list" {...props} />;
}
