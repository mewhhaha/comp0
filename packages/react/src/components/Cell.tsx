import { type RefProp } from "../shared.js";
import { type TdHTMLAttributes } from "react";

export type CellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function Cell(props: CellProps & RefProp<HTMLTableCellElement>) {
  const { ref } = props;
  return <td {...props} ref={ref} />;
}
