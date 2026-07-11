import { type TdHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useTableCell } from "./table-shared.js";

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function TableCell({ ref, ...props }: TableCellProps & RefProp<HTMLTableCellElement>) {
  const { cellRef, tabIndex } = useTableCell(ref);
  return <td {...props} ref={cellRef} tabIndex={tabIndex} />;
}
