import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationListProps = ComponentProps<"ul"> & AsProp;

export function PaginationList({ as, ...props }: PaginationListProps) {
  usePaginationContext("PaginationList");
  const Part = partElement(as, "ul");
  return <Part {...props} />;
}
