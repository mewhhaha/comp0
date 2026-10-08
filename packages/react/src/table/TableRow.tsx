import { type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOptionalTableContext } from "./table-shared.js";

export type TableRowProps = ComponentProps<"tr"> &
  AsProp & {
    /** Marks the row as selected for aria and styling; you own the state. */
    selected?: boolean | undefined;
    /** Row identity used by the table's range selection. */
    value?: string | undefined;
  };

export function TableRow({ as, selected, value, ref, ...props }: TableRowProps) {
  const rows = useOptionalTableContext()?.rows;
  const Part = partElement(as, "tr");
  return (
    <Part
      {...props}
      ref={composeRefs(ref, (element: HTMLTableRowElement | null) => {
        if (!rows || value === undefined) return;
        rows.register({ key: value, textValue: value, element });
        return () => {
          rows.unregister(value, element);
        };
      })}
      aria-selected={selected}
      data-selected={dataAttr(Boolean(selected))}
      data-value={value}
    />
  );
}
