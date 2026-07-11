import { useMemo, type ThHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { TableColumnContext, useTableCell } from "./table-shared.js";

export type TableColumnProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** The current sort of this column; you sort the rows yourself. */
  sort?: "ascending" | "descending" | "none" | undefined;
  /** Runs when the header is clicked or activated with Enter or Space. */
  onSort?: (() => void) | undefined;
  /** Receives the next width when resized by keyboard or a resizer drag. */
  onResize?: ((width: number) => void) | undefined;
};

const RESIZE_STEP = 16;

export function TableColumn({
  sort,
  onSort,
  onResize,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TableColumnProps & RefProp<HTMLTableCellElement>) {
  const { cellRef, elementRef, tabIndex } = useTableCell(ref);
  const columnContext = useMemo(
    () => ({
      resize: (width: number) => onResize?.(width),
      element: () => elementRef.current,
    }),
    [elementRef, onResize],
  );
  const header = (
    <th
      scope={props.scope ?? "col"}
      {...props}
      ref={cellRef}
      tabIndex={tabIndex}
      aria-sort={sort}
      data-sort={sort === "ascending" || sort === "descending" ? sort : undefined}
      data-sortable={dataAttr(Boolean(onSort))}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSort?.();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (onSort && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSort();
          return;
        }
        if (!onResize || !event.shiftKey) return;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const width = elementRef.current?.offsetWidth ?? 0;
        const delta = event.key === "ArrowRight" ? RESIZE_STEP : -RESIZE_STEP;
        onResize(Math.max(0, width + delta));
      }}
    />
  );
  if (!onResize) return header;
  return <TableColumnContext.Provider value={columnContext}>{header}</TableColumnContext.Provider>;
}
