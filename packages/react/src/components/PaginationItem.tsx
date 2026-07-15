import { type LiHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationItemProps = LiHTMLAttributes<HTMLLIElement>;

export function PaginationItem(props: PaginationItemProps & RefProp<HTMLLIElement>) {
  usePaginationContext("PaginationItem");
  const { ref } = props;
  return <li {...props} ref={ref} />;
}
