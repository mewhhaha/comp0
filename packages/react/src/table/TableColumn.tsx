import { type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { TableColumnContext, useTableCell } from "./table-shared.js";

const RESIZE_STEP = 16;

export type TableColumnProps = ComponentProps<"th"> &
  AsProp & {
    /** The current sort of this column; you sort the rows yourself. */
    sort?: "ascending" | "descending" | "none" | undefined;
    /** Runs when the header is clicked or activated with Enter or Space. */
    onSort?: (() => void) | undefined;
    /** Receives the next width when resized by keyboard or a resizer drag. */
    onResize?: ((width: number) => void) | undefined;
  };

export function TableColumn({
  as,
  sort,
  onSort,
  onResize,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TableColumnProps) {
  const { cellRef, elementRef, tabIndex } = useTableCell(ref);
  const columnContext = {
    resize: (width: number) => onResize?.(width),
    element: () => elementRef.current,
  };
  const Part = partElement(as, "th");
  const header = (
    <Part
      {...props}
      scope={props.scope ?? "col"}
      ref={cellRef}
      tabIndex={tabIndex}
      aria-sort={sort}
      data-sortable={dataAttr(Boolean(onSort))}
      onClick={(event: MouseEvent<HTMLTableCellElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSort?.();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTableCellElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (
          onSort &&
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
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
  return <TableColumnContext value={columnContext}>{header}</TableColumnContext>;
}
