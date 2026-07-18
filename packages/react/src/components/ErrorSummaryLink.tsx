import { type AnchorHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

export type ErrorSummaryLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function ErrorSummaryLink({
  children,
  ref,
  ...props
}: ErrorSummaryLinkProps & RefProp<HTMLAnchorElement>) {
  return (
    <a {...props} ref={ref} data-slot={dataSlot(props, "error-summary-link")}>
      {children}
    </a>
  );
}
