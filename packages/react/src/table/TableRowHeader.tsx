import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useTableCell } from "./table-shared.js";

export type TableRowHeaderProps = ComponentProps<"th"> & AsProp;

export function TableRowHeader({ as, ref, ...props }: TableRowHeaderProps) {
  const { cellRef, tabIndex } = useTableCell(ref);
  const Part = partElement(as, "th");
  return <Part scope="row" {...props} ref={cellRef} tabIndex={tabIndex} />;
}
