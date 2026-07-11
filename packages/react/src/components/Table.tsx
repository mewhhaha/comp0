import { useCallback, useMemo, useRef, useState, type TableHTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { cellWidget, TableContext, type TableContextValue } from "./table-shared.js";

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
          // APG grid pattern: arrows move one cell, Home/End travel the row,
          // and Ctrl+Home/End jump to the grid's corners.
          let next: HTMLTableCellElement | undefined;
          if (event.key === "ArrowRight") next = row.cells[cell.cellIndex + 1];
          else if (event.key === "ArrowLeft") next = row.cells[cell.cellIndex - 1];
          else if (event.key === "ArrowDown") next = rows[rowIndex + 1]?.cells[cell.cellIndex];
          else if (event.key === "ArrowUp") next = rows[rowIndex - 1]?.cells[cell.cellIndex];
          else if (event.key === "Home" && event.ctrlKey) next = rows[0]?.cells[0];
          else if (event.key === "Home") next = row.cells[0];
          else if (event.key === "End" && event.ctrlKey) {
            const lastRow = rows.at(-1);
            next = lastRow?.cells[lastRow.cells.length - 1];
          } else if (event.key === "End") next = row.cells[row.cells.length - 1];
          if (!next || next === cell) return;
          event.preventDefault();
          const key = keyFor(next);
          if (key) setActiveKey(key);
          (cellWidget(next) ?? next).focus();
        }}
      >
        {children}
      </table>
    </TableContext.Provider>
  );
}
