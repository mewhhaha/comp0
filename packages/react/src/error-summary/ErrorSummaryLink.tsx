import { type ComponentProps, type ElementType } from "react";
import { partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type ErrorSummaryLinkProps<TElement extends ElementType = "a"> = Omit<
  ComponentProps<TElement>,
  "as"
> & {
  as?: TElement | undefined;
};

export function ErrorSummaryLink<TElement extends ElementType = "a">({
  as,
  ...props
}: ErrorSummaryLinkProps<TElement>) {
  const Part = partElement(as, "a");
  return <Part {...props} data-slot={dataSlot(props, "error-summary-link")} />;
}
