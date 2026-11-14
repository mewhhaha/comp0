import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useTableCell } from "./table-shared.js";

export type TableRowHeaderProps = ComponentProps<"th"> & AsProp;

export function TableRowHeader({ as, ref, ...props }: TableRowHeaderProps) {
  const { cellRef, tabIndex, owner } = useTableCell(ref);
  const Part = partElement(as, "th");
  return (
    <Part
      scope="row"
      {...props}
      ref={cellRef}
      tabIndex={tabIndex}
      data-slot="table-row-header"
      data-comp0-owner={owner}
    />
  );
}
