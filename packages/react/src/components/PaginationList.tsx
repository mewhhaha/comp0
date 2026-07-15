import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationListProps = HTMLAttributes<HTMLUListElement>;

export function PaginationList(props: PaginationListProps & RefProp<HTMLUListElement>) {
  usePaginationContext("PaginationList");
  const { ref } = props;
  return <ul {...props} ref={ref} />;
}
