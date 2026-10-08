import { useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { useCollection, useComposedRefs, type CollectionItem } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { primaryStop, rowStops, TableContext, type TableContextValue } from "./table-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

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
  onKeyDown,
  onClick,
  onMouseDown,
  children,
  ref,
  ...props
}: TableProps) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const composedRef = useComposedRefs(tableRef, ref);
  const [activeKey, setActiveKey] = useState("");
  const cells = useCollection();
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

  // The first registered cell becomes the roving tab stop.
  const register = (item: CollectionItem) => {
    cells.register(item);
    if (!item.element) return;
    setActiveKey((current) => current || item.key);
  };

  const keyFor = (element: Element) => cells.items().find((item) => item.element === element)?.key;

  const context: TableContextValue = {
    activeKey,
    setActiveKey,
    register,
    keyFor,
    rows: valuedRows,
  };

  const Part = partElement(as, "table");
  return (
    <TableContext value={context}>
      <Part
        {...props}
        ref={composedRef}
        role="grid"
        onMouseDown={(event: MouseEvent<HTMLTableElement>) => {
          onMouseDown?.(event);
          // Keep shift-clicks from smearing a text selection over the range.
          if (event.shiftKey && onRangeSelect) event.preventDefault();
        }}
        onClick={(event: MouseEvent<HTMLTableElement>) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof Element ? event.target : null;
          const row = target?.closest("tr") ?? null;
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
          const target = event.target instanceof Element ? event.target.closest("td, th") : null;
          if (!table || !target || !table.contains(target)) return;
          const cell = target as HTMLTableCellElement;
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
          const nextCell = next.closest<HTMLTableCellElement>("td, th");
          const key = nextCell ? keyFor(nextCell) : undefined;
          if (key) setActiveKey(key);
          next.focus();
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
