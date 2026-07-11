import { useCallback, useMemo, useRef, useState, type TableHTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { primaryStop, rowStops, TableContext, type TableContextValue } from "./table-shared.js";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table({
  onKeyDown,
  children,
  ref,
  ...props
}: TableProps & RefProp<HTMLTableElement>) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const cellMap = useRef(new Map<string, HTMLTableCellElement>());

  const register = useCallback((key: string, element: HTMLTableCellElement | null) => {
    if (!element) {
      cellMap.current.delete(key);
      return;
    }
    cellMap.current.set(key, element);
    if (!activeKeyRef.current) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  }, []);

  const keyFor = useCallback((element: Element) => {
    for (const [key, cell] of cellMap.current) if (cell === element) return key;
    return undefined;
  }, []);

  const context: TableContextValue = useMemo(
    () => ({ activeKey, setActiveKey, register, keyFor }),
    [activeKey, keyFor, register],
  );

  return (
    <TableContext.Provider value={context}>
      <table
        {...props}
        ref={composeRefs(tableRef, ref)}
        role="grid"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Shift+Arrow belongs to column resizing on the header cells.
          if (event.shiftKey || event.altKey || event.metaKey) return;
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
            next = stops[index + (event.key === "ArrowRight" ? 1 : -1)];
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
        }}
      >
        {children}
      </table>
    </TableContext.Provider>
  );
}
