import { useRef, useState, type TableHTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { primaryStop, rowStops, TableContext, type TableContextValue } from "./table-shared.js";

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /**
   * Receives the row values from the selection anchor to the target row on
   * Shift+Click and Shift+ArrowUp/ArrowDown; you apply them to your state.
   */
  onRangeSelect?: ((values: string[]) => void) | undefined;
};

export function Table({
  onRangeSelect,
  onKeyDown,
  onClick,
  onMouseDown,
  children,
  ref,
  ...props
}: TableProps & RefProp<HTMLTableElement>) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const cellMap = useRef(new Map<string, HTMLTableCellElement>());
  const anchorRef = useRef<string | null>(null);

  const valuedRows = () => {
    const table = tableRef.current;
    if (!table) return [] as HTMLTableRowElement[];
    return [...table.querySelectorAll<HTMLTableRowElement>("tr[data-value]")];
  };
  const rangeBetween = (anchorValue: string, target: HTMLTableRowElement) => {
    const rows = valuedRows();
    const from = rows.findIndex((row) => row.dataset["value"] === anchorValue);
    const to = rows.indexOf(target);
    if (from === -1 || to === -1) return [];
    const [low, high] = from < to ? [from, to] : [to, from];
    return rows.slice(low, high + 1).flatMap((row) => row.dataset["value"] ?? []);
  };

  const register = (key: string, element: HTMLTableCellElement | null) => {
    if (!element) {
      cellMap.current.delete(key);
      return;
    }
    cellMap.current.set(key, element);
    if (!activeKeyRef.current) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  };

  const keyFor = (element: Element) => {
    for (const [key, cell] of cellMap.current) if (cell === element) return key;
    return undefined;
  };

  const context: TableContextValue = { activeKey, setActiveKey, register, keyFor };

  return (
    <TableContext value={context}>
      <table
        {...props}
        ref={composeRefs(tableRef, ref)}
        role="grid"
        onMouseDown={(event) => {
          onMouseDown?.(event);
          // Keep shift-clicks from smearing a text selection over the range.
          if (event.shiftKey && onRangeSelect) event.preventDefault();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof Element ? event.target : null;
          const row = target?.closest<HTMLTableRowElement>("tr[data-value]");
          const value = row?.dataset["value"];
          if (!row || !value) return;
          if (event.shiftKey && onRangeSelect && anchorRef.current) {
            onRangeSelect(rangeBetween(anchorRef.current, row));
            return;
          }
          anchorRef.current = value;
        }}
        onKeyDown={(event) => {
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
          const landedValue = nextCell?.parentElement?.dataset["value"];
          if (extending) {
            anchorRef.current = anchorRef.current ?? row.dataset["value"] ?? landedValue ?? null;
            const landedRow = nextCell?.parentElement;
            if (anchorRef.current && landedRow instanceof HTMLTableRowElement && landedValue) {
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
      </table>
    </TableContext>
  );
}
