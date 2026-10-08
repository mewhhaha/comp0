import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useErrorSummaryContext } from "./error-summary-shared.js";

export type ErrorSummaryTitleProps = ComponentProps<"h2"> & AsProp;

export function ErrorSummaryTitle({ as, ...props }: ErrorSummaryTitleProps) {
  const summary = useErrorSummaryContext("ErrorSummaryTitle");
  const Part = partElement(as, "h2");
  return <Part data-slot="error-summary-title" {...props} id={props.id ?? summary.titleId} />;
}
