import { type ComponentPropsWithRef, type ElementType } from "react";
import { partElement } from "../internal/polymorphic.js";

export type ErrorSummaryLinkProps<TElement extends ElementType = "a"> = Omit<
  ComponentPropsWithRef<TElement>,
  "as"
> & {
  as?: TElement | undefined;
};

export function ErrorSummaryLink<TElement extends ElementType = "a">({
  as,
  ...props
}: ErrorSummaryLinkProps<TElement>) {
  const Part = partElement(as, "a");
  return <Part data-slot="error-summary-link" {...(props as ComponentPropsWithRef<"a">)} />;
}
