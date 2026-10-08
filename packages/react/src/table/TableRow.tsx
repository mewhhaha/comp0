import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TableRowProps = ComponentProps<"tr"> &
  AsProp & {
    /** Marks the row as selected for aria and styling; you own the state. */
    selected?: boolean | undefined;
    /** Row identity used by the table's range selection. */
    value?: string | undefined;
  };

export function TableRow({ as, selected, value, ...props }: TableRowProps) {
  const Part = partElement(as, "tr");
  return (
    <Part
      {...props}
      aria-selected={selected}
      data-selected={dataAttr(Boolean(selected))}
      data-value={value}
    />
  );
}
