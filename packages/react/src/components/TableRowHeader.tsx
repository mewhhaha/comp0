import { type ThHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useTableCell } from "./table-shared.js";

export type TableRowHeaderProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TableRowHeader({
  ref,
  ...props
}: TableRowHeaderProps & RefProp<HTMLTableCellElement>) {
  const { cellRef, tabIndex } = useTableCell(ref);
  return <th scope="row" {...props} ref={cellRef} tabIndex={tabIndex} />;
}
