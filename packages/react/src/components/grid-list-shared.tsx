import { createContext } from "react";
import { type SelectableCollectionContextValue } from "./collection-shared.js";

export const GridListContext = createContext<SelectableCollectionContextValue | null>(null);

export type GridListDropTarget = {
  value: string;
  edge: "before" | "after";
};

export type GridListDndContextValue = {
  dragValue: string;
  dropTarget: GridListDropTarget | null;
  startDrag: (value: string) => void;
  setDropTarget: (target: GridListDropTarget | null) => void;
  commitDrop: () => void;
  endDrag: () => void;
  moveItem: (value: string, delta: -1 | 1) => void;
};

export const GridListDndContext = createContext<GridListDndContextValue | null>(null);

export type GridListItemContextValue = {
  value: string;
  label: string;
  reorderable: boolean;
  /** Called by a mounted GridListDragHandle; returns its cleanup. While one is registered the row itself stops being draggable. */
  registerHandle: () => () => void;
};

export const GridListItemContext = createContext<GridListItemContextValue | null>(null);

export const FOCUSABLE_SELECTOR =
  "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]";

/** The focusable elements inside a row, excluding the row itself. */
export function rowFocusables(row: HTMLElement) {
  return [...row.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element !== row,
  );
}
