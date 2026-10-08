import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationItemProps = ComponentProps<"li"> & AsProp;

export function PaginationItem({ as, ...props }: PaginationItemProps) {
  usePaginationContext("PaginationItem");
  const Part = partElement(as, "li");
  return <Part {...props} />;
}
