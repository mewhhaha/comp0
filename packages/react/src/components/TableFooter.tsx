import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableFooter(props: TableFooterProps & RefProp<HTMLTableSectionElement>) {
  const { ref } = props;
  return <tfoot {...props} ref={ref} />;
}
