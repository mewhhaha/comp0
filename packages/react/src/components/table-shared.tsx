import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef } from "react";
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

/**
 * The single interactive widget inside a cell, if that is all it holds. The
 * grid pattern focuses such a widget instead of its cell.
 */
export function cellWidget(cell: HTMLTableCellElement) {
  const widgets = [...cell.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
  return widgets.length === 1 ? widgets[0] : undefined;
}

/** Registration and roving tabindex shared by header and body cells. */
export function useTableCell(ref: React.Ref<HTMLTableCellElement> | undefined) {
  const table = useContext(TableContext);
  const key = useId().replace(/:/g, "");
  const register = table?.register;
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  const cellRef = useCallback(
    (element: HTMLTableCellElement | null) => {
      elementRef.current = element;
      register?.(key, element);
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [key, ref, register],
  );
  const tabIndex = table?.activeKey === key ? 0 : -1;

  // A cell whose only content is one widget hands its grid stop to the
  // widget, so the table still exposes a single tab stop.
  useLayoutEffect(() => {
    const cell = elementRef.current;
    if (!cell) return;
    const widget = cellWidget(cell);
    if (!widget) return;
    cell.tabIndex = -1;
    widget.tabIndex = tabIndex;
  });

  return { cellRef, elementRef, tabIndex };
}
