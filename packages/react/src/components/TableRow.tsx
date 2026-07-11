import { type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Marks the row as selected for aria and styling; you own the state. */
  selected?: boolean | undefined;
};

export function TableRow({
  selected,
  ref,
  ...props
}: TableRowProps & RefProp<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      ref={ref}
      aria-selected={selected === undefined ? undefined : selected}
      data-selected={dataAttr(Boolean(selected))}
    />
  );
}
