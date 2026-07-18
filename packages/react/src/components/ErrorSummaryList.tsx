import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

export type ErrorSummaryListProps = HTMLAttributes<HTMLUListElement>;

export function ErrorSummaryList({
  ref,
  ...props
}: ErrorSummaryListProps & RefProp<HTMLUListElement>) {
  return <ul {...props} ref={ref} data-slot={dataSlot(props, "error-summary-list")} />;
}
