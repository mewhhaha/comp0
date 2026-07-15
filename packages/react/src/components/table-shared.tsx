import { createContext, useContext, useId, useLayoutEffect, useRef } from "react";
import { assignRef } from "@comp0/core";
import { FOCUSABLE_SELECTOR } from "./grid-list-shared.js";

export interface TableContextValue {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (key: string, element: HTMLTableCellElement | null) => void;
  keyFor: (element: Element) => string | undefined;
}

export const TableContext = createContext<TableContextValue | null>(null);

export interface TableColumnContextValue {
  resize: (width: number) => void;
  element: () => HTMLTableCellElement | null;
}

export const TableColumnContext = createContext<TableColumnContextValue | null>(null);

/** The interactive elements inside a cell, in document order. */
function cellWidgets(cell: HTMLTableCellElement) {
  return [...cell.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
}

/**
 * A body cell holding exactly one widget hands its grid stop to the widget
 * (the checkbox-column case). Header cells always stay stops themselves so
 * sorting and resizing remain reachable.
 */
function delegatedWidget(cell: HTMLTableCellElement) {
  if (cell.tagName !== "TD") return undefined;
  const widgets = cellWidgets(cell);
  return widgets.length === 1 ? widgets[0] : undefined;
}

/** Where vertical navigation and the roving tab stop land for a cell. */
export function primaryStop(cell: HTMLTableCellElement) {
  return delegatedWidget(cell) ?? cell;
}

/**
 * The ArrowLeft/ArrowRight stops of a row: each cell, then the widgets
 * inside it, with delegated single-widget cells collapsing to the widget.
 */
export function rowStops(row: HTMLTableRowElement) {
  const stops: HTMLElement[] = [];
  for (const cell of row.cells) {
    const delegated = delegatedWidget(cell);
    if (delegated) {
      stops.push(delegated);
      continue;
    }
    stops.push(cell, ...cellWidgets(cell));
  }
  return stops;
}

/** Registration and roving tabindex shared by header and body cells. */
export function useTableCell(ref: React.Ref<HTMLTableCellElement> | undefined) {
  const table = useContext(TableContext);
  const key = useId().replace(/:/g, "");
  const register = table?.register;
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  const cellRef = (element: HTMLTableCellElement | null) => {
    elementRef.current = element;
    register?.(key, element);
    assignRef(ref, element);
  };
  const tabIndex = table?.activeKey === key ? 0 : -1;

  // Widgets inside cells are reachable with the arrow keys, never with Tab,
  // so the table exposes exactly one tab stop. A delegated single-widget
  // body cell hands its roving stop to the widget.
  useLayoutEffect(() => {
    const cell = elementRef.current;
    if (!cell) return;
    const delegated = delegatedWidget(cell);
    for (const widget of cellWidgets(cell)) widget.tabIndex = widget === delegated ? tabIndex : -1;
    if (delegated) cell.tabIndex = -1;
  });

  return { cellRef, elementRef, tabIndex };
}
