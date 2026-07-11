import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export function TableRow(props: TableRowProps & RefProp<HTMLTableRowElement>) {
  const { ref } = props;
  return <tr {...props} ref={ref} />;
}
