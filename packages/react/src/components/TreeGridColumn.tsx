import { type ThHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

/* oxlint-disable jsx-a11y/no-redundant-roles -- Headers need an explicit role inside a table promoted to treegrid. */

export type TreeGridColumnProps = ThHTMLAttributes<HTMLTableCellElement>;

export function TreeGridColumn({
  ref,
  ...props
}: TreeGridColumnProps & RefProp<HTMLTableCellElement>) {
  return <th {...props} ref={ref} role="columnheader" scope={props.scope ?? "col"} />;
}
