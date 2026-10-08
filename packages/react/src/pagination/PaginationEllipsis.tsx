import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationEllipsisProps = ComponentProps<"span"> & AsProp;

export function PaginationEllipsis({ as, children = "…", ...props }: PaginationEllipsisProps) {
  usePaginationContext("PaginationEllipsis");
  const Part = partElement(as, "span");
  return (
    <Part {...props} aria-hidden="true">
      {children}
    </Part>
  );
}
