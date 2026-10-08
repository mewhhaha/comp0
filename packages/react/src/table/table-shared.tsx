import { useId, useLayoutEffect, useRef, type Ref } from "react";
import { assignRef, type Collection, type CollectionItem } from "@comp0/core";
import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";
import { createRequiredContext } from "../internal/context.js";

export type TableContextValue = {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (item: CollectionItem) => void;
  keyFor: (element: Element) => string | undefined;
  /** Rows that carry a value, in document order, for range selection. */
  rows: Collection;
};

export const [TableContext, useTableContext, useOptionalTableContext] =
  createRequiredContext<TableContextValue>("Table");

export type TableColumnContextValue = {
  resize: (width: number) => void;
  element: () => HTMLTableCellElement | null;
};

export const [TableColumnContext, useTableColumnContext, useOptionalTableColumnContext] =
  createRequiredContext<TableColumnContextValue>("TableColumn");

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
 * The inline-axis stops of a row: each cell, then the widgets inside it, with
 * delegated single-widget cells collapsing to the widget.
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
export function useTableCell(ref: Ref<HTMLTableCellElement> | undefined) {
  const table = useOptionalTableContext();
  const key = useId().replace(/:/g, "");
  const register = table?.register;
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  const cellRef = (element: HTMLTableCellElement | null) => {
    elementRef.current = element;
    register?.({ key, textValue: "", element });
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
