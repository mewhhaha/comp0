import {
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useCollection, useComposedRefs } from "@comp0/core";
import { useCollectionSeed } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { NO_SELECTION, useTabStopStore } from "../internal/tab-stop.js";
import {
  CELL_WIDGET_ATTRIBUTES,
  ownerCell,
  primaryStop,
  rowStops,
  TableContext,
  type TableContextValue,
} from "./table-shared.js";
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
  onFocus,
  onKeyDown,
  onClick,
  onMouseDown,
  children,
  ref,
  ...props
}: TableProps) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const cells = useCollection();
  const [cellSyncs] = useState(() => new Map<Element, () => void>());
  // Whether a cell hands its stop to a single widget, and which widgets Tab skips, depends on
  // consumer content that can change without re-rendering the cell (a component inside it
  // updating its own state), so one observer re-measures the cells whose content changed.
  const observeCellContent = (table: HTMLTableElement | null) => {
    const Observer = table?.ownerDocument.defaultView?.MutationObserver;
    if (!table || !Observer) return;
    const observer = new Observer((records) => {
      const touched = new Set<() => void>();
      for (const record of records) {
        // Only childList and attribute records are observed, so the target is an element. A
        // change inside a grid nested in a cell belongs to that grid and finds no cell here.
        const target = record.target as Element;
        const cell = ownerCell(target, table, (candidate) => cellSyncs.has(candidate));
        const sync = cell ? cellSyncs.get(cell) : undefined;
        if (sync) touched.add(sync);
      }
      for (const sync of touched) sync();
    });
    observer.observe(table, {
      subtree: true,
      childList: true,
      attributeFilter: CELL_WIDGET_ATTRIBUTES,
    });
    return () => {
      observer.disconnect();
    };
  };
  const composedRef = useComposedRefs(tableRef, ref, observeCellContent);
  // The stop follows the cell that last held focus (itself or a widget inside it) and is
  // remembered after focus leaves, so Tab returns there; with no record it is the first cell.
  // It lives outside React state: an arrow press re-renders only the two cells whose tabIndex
  // changes, not every cell reading this context (bench: collection-tab-stop.bench.tsx,
  // PERFORMANCE.md). On the server and while hydrating, cells record themselves in render
  // order, so the first cell already holds the stop in server HTML.
  const seed = useCollectionSeed();
  const tabStops = useTabStopStore(cells, seed);
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

  const keyFor = (element: Element) => cells.items().find((item) => item.element === element)?.key;
  // The cell of this table an event target sits in; see `ownerCell`.
  const cellOf = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;
    return ownerCell(target, tableRef.current, (cell) => cellSyncs.has(cell));
  };

  const context: TableContextValue = { cells, seed, tabStops, rows: valuedRows, cellSyncs };

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
          const cell = cellOf(event.target);
          const key = cell ? keyFor(cell) : undefined;
          if (key) tabStops.focus(key, NO_SELECTION);
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
          const nextCell = cellOf(next);
          const key = nextCell ? keyFor(nextCell) : undefined;
          if (key) tabStops.focus(key, NO_SELECTION);
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
