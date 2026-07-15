import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationEllipsisProps = HTMLAttributes<HTMLSpanElement>;

export function PaginationEllipsis({
  children = "…",
  ref,
  ...props
}: PaginationEllipsisProps & RefProp<HTMLSpanElement>) {
  usePaginationContext("PaginationEllipsis");
  return (
    <span {...props} ref={ref} aria-hidden="true">
      {children}
    </span>
  );
}
