import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
export function TableLoadMoreItem(
  props: HTMLAttributes<HTMLTableRowElement> & RefProp<HTMLTableRowElement>,
) {
  const { ref } = props;
  return <tr {...props} ref={ref} data-slot="table-load-more-item" />;
}
