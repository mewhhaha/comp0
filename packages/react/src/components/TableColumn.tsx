import { type ThHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useTableCell } from "./table-shared.js";

export type TableColumnProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TableColumn({ ref, ...props }: TableColumnProps & RefProp<HTMLTableCellElement>) {
  const { cellRef, tabIndex } = useTableCell(ref);
  return <th scope={props.scope ?? "col"} {...props} ref={cellRef} tabIndex={tabIndex} />;
}
