import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useTableCell } from "./table-shared.js";

export type TableCellProps = ComponentProps<"td"> & AsProp;

export function TableCell({ as, ref, ...props }: TableCellProps) {
  const { cellRef, tabIndex } = useTableCell(ref);
  const Part = partElement(as, "td");
  return <Part {...props} ref={cellRef} tabIndex={tabIndex} />;
}
