import {
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useCollection, useComposedRefs } from "@comp0/core";
import { useCollectionSeed } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { writingDirection } from "../internal/writing-direction.js";
import { attachGrid, focusStop, moveStop, ownerCell, primaryStop, rowStops } from "./table-dom.js";
import { TableContext, type TableContextValue } from "./table-shared.js";

export type TableProps = ComponentProps<"table"> &
  AsProp & {
    /**
     * Receives the row values from the selection anchor to the target row on
     * Shift+Click and Shift+ArrowUp/ArrowDown; you apply them to your state.
     */
    onRangeSelect?: ((values: string[]) => void) | undefined;
  };

export function Table({
  as,
  onRangeSelect,
  onFocus,
  onKeyDown,
  onClick,
  onMouseDown,
  children,
  ref,
  ...props
}: TableProps) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const composedRef = useComposedRefs(tableRef, ref, attachGrid);
  // On the server and while hydrating, cells record themselves in render order, so the first
  // cell renders the stop in server HTML.
  const seed = useCollectionSeed();
  const valuedRows = useCollection();
  const anchorRef = useRef<string | null>(null);

  // Rows with a value register into their own collection, which keeps them in
  // document order for range selection.
  const rangeBetween = (anchorValue: string, target: Element | null) => {
    const keys = valuedRows.items().map((row) => row.key);
    const from = keys.indexOf(anchorValue);
    const to = keys.indexOf(valuedRows.items().find((row) => row.element === target)?.key ?? "");
    if (from === -1 || to === -1) return [];
    const [low, high] = from < to ? [from, to] : [to, from];
    return keys.slice(low, high + 1);
  };

  // The cell of this table an event target sits in; see `ownerCell`.
  const cellOf = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return ownerCell(target, tableRef.current);
  };

  const context: TableContextValue = { seed, rows: valuedRows };

  const Part = partElement(as, "table");
  return (
    <TableContext value={context}>
      <Part
        {...props}
        ref={composedRef}
        role="grid"
        onFocus={(event: FocusEvent<HTMLTableElement>) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          // A click or programmatic focus on a cell, or on a widget inside one, moves the stop.
          // Cells of a grid nested inside a cell belong to that grid, not this one.
          const table = tableRef.current;
          const stop = table ? focusStop(table, event.target) : null;
          if (table && stop) moveStop(table, stop);
        }}
        onMouseDown={(event: MouseEvent<HTMLTableElement>) => {
          onMouseDown?.(event);
          // Keep shift-clicks from smearing a text selection over the range.
          if (event.shiftKey && onRangeSelect) event.preventDefault();
        }}
        onClick={(event: MouseEvent<HTMLTableElement>) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof Element ? event.target : null;
          const row = cellOf(target)?.parentElement ?? target?.closest("tr") ?? null;
          const value = valuedRows.items().find((item) => item.element === row)?.key;
          if (!row || !value) return;
          if (event.shiftKey && onRangeSelect && anchorRef.current) {
            onRangeSelect(rangeBetween(anchorRef.current, row));
            return;
          }
          anchorRef.current = value;
        }}
        onKeyDown={(event: KeyboardEvent<HTMLTableElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const verticalKey = event.key === "ArrowDown" || event.key === "ArrowUp";
          const extending = Boolean(event.shiftKey && verticalKey && onRangeSelect);
          // Shift+ArrowLeft/Right belongs to column resizing on the headers;
          // Shift+ArrowUp/Down extends the selection while moving.
          if ((event.shiftKey && !extending) || event.altKey || event.metaKey) return;
          const table = tableRef.current;
          // Keys from a grid nested inside a cell belong to that grid, even the ones it leaves.
          const cell = cellOf(event.target);
          if (!table || !cell) return;
          const row = cell.parentElement as HTMLTableRowElement;
          const rows = [...table.rows];
          const rowIndex = rows.indexOf(row);
          const focused = event.target instanceof HTMLElement ? event.target : cell;
          // APG grid pattern: Left/Right walk each cell and the widgets
          // inside it, Up/Down move by column, Home/End travel the row, and
          // Ctrl+Home/End jump to the grid's corners.
          let next: HTMLElement | undefined;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            const stops = rowStops(row);
            const index = stops.indexOf(focused);
            if (index === -1) return;
            const rightStep = writingDirection(event.currentTarget) === "rtl" ? -1 : 1;
            next = stops[index + (event.key === "ArrowRight" ? rightStep : -rightStep)];
          } else if (event.key === "ArrowDown") {
            const below = rows[rowIndex + 1]?.cells[cell.cellIndex];
            if (below) next = primaryStop(below);
          } else if (event.key === "ArrowUp") {
            const above = rows[rowIndex - 1]?.cells[cell.cellIndex];
            if (above) next = primaryStop(above);
          } else if (event.key === "Home" && event.ctrlKey) {
            const first = rows[0]?.cells[0];
            if (first) next = primaryStop(first);
          } else if (event.key === "Home") {
            const first = row.cells[0];
            if (first) next = primaryStop(first);
          } else if (event.key === "End" && event.ctrlKey) {
            const lastRow = rows.at(-1);
            const last = lastRow?.cells[lastRow.cells.length - 1];
            if (last) next = primaryStop(last);
          } else if (event.key === "End") {
            const last = row.cells[row.cells.length - 1];
            if (last) next = primaryStop(last);
          }
          if (!next || next === focused) return;
          event.preventDefault();
          const stop = focusStop(table, next);
          if (stop) moveStop(table, stop);
          next.focus();
          const nextCell = cellOf(next);
          const landedRow = nextCell?.parentElement ?? null;
          const landedValue = valuedRows.items().find((item) => item.element === landedRow)?.key;
          if (extending) {
            const rowValue = valuedRows.items().find((item) => item.element === row)?.key;
            anchorRef.current = anchorRef.current ?? rowValue ?? landedValue ?? null;
            if (anchorRef.current && landedValue) {
              onRangeSelect?.(rangeBetween(anchorRef.current, landedRow));
            }
            return;
          }
          if (verticalKey || event.key === "Home" || event.key === "End") {
            if (landedValue) anchorRef.current = landedValue;
          }
        }}
      >
        {children}
      </Part>
    </TableContext>
  );
}
