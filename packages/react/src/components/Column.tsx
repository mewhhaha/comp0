import { type RefProp } from "../shared.js";
import { type ThHTMLAttributes } from "react";

export type ColumnProps = ThHTMLAttributes<HTMLTableCellElement> & {
  isRowHeader?: boolean | undefined;
};

export function Column({
  isRowHeader,
  scope,
  ref,
  ...props
}: ColumnProps & RefProp<HTMLTableCellElement>) {
  return <th {...props} ref={ref} scope={scope ?? (isRowHeader ? "row" : "col")} />;
}
