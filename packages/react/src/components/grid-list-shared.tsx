import { createContext } from "react";
import {
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";

export type GridListContextValue = Omit<SelectableCollectionContextValue, "register"> & {
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
    removedElement?: HTMLElement,
  ) => void;
  items: () => CollectionItemRecord[];
};

export const GridListContext = createContext<GridListContextValue | null>(null);

export type GridListDropTarget = {
  value: string;
  edge: "before" | "after";
};

export type GridListOrder = Readonly<Record<string, readonly string[]>>;

export type GridListMove = {
  value: string;
  from: { list: string; index: number };
  to: { list: string; index: number };
  before: string | null;
};

export type GridListGroupSource = {
  list: string;
  value: string;
  label: string;
};

export type GridListGroupDropTarget = {
  list: string;
  value: string | null;
  edge: "before" | "after";
};

export type GridListFocusRequest = {
  list: string;
  value: string;
};

export type GridListReorderGroupContextValue = {
  source: GridListGroupSource | null;
  target: GridListGroupDropTarget | null;
  focusRequest: GridListFocusRequest | null;
  movePending: boolean;
  hasList: (name: string) => boolean;
  acknowledgeFocusRequest: (request: GridListFocusRequest) => void;
  registerList: (name: string, element: HTMLElement) => void;
  unregisterList: (name: string, element: HTMLElement) => void;
  registerRow: (
    list: string,
    value: string,
    label: string,
    element: HTMLElement,
    disabled: boolean,
  ) => void;
  unregisterRow: (list: string, value: string, element: HTMLElement) => void;
  startDrag: (list: string, value: string, label: string) => void;
  setDropTarget: (target: GridListGroupDropTarget | null) => void;
  commitDrop: () => void;
  endDrag: () => void;
  /** Starts a keyboard move session: arrows retarget, Enter drops, Escape cancels. */
  beginKeyboardMove: (list: string, value: string) => void;
  retargetKeyboardMove: (direction: "up" | "down" | "left" | "right") => void;
  commitKeyboardMove: () => void;
  cancelKeyboardMove: () => void;
  moveWithin: (list: string, value: string, delta: -1 | 1) => void;
  moveTo: (list: string, value: string, targetList: string) => void;
  canMoveTo: (list: string, value: string, targetList: string) => boolean;
  getListLabel: (name: string) => string;
};

export const GridListReorderGroupContext = createContext<GridListReorderGroupContextValue | null>(
  null,
);

export type GridListDndContextValue = {
  listName?: string | undefined;
  dragValue: string;
  dragLabel: string;
  hasDropTarget: boolean;
  dropTarget: GridListDropTarget | null;
  listDropTarget: boolean;
  startDrag: (value: string, label: string) => void;
  setDropTarget: (target: GridListDropTarget | null) => void;
  setDropAtEnd: () => void;
  commitDrop: () => void;
  endDrag: () => void;
  moveItem: (value: string, delta: -1 | 1) => void;
  /** Starts a keyboard move session: arrows retarget, Enter drops, Escape cancels. */
  beginKeyboardMove: (value: string) => void;
  retargetKeyboardMove: (direction: "up" | "down" | "left" | "right") => void;
  commitKeyboardMove: () => void;
  cancelKeyboardMove: () => void;
};

export const GridListDndContext = createContext<GridListDndContextValue | null>(null);

export type GridListItemContextValue = {
  value: string;
  label: string;
  listName?: string | undefined;
  reorderable: boolean;
};

export const GridListItemContext = createContext<GridListItemContextValue | null>(null);

export const FOCUSABLE_SELECTOR =
  "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]";

/** The focusable elements inside a row, excluding the row itself. */
export function rowFocusables(row: HTMLElement) {
  return [...row.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element !== row && !element.matches(":disabled"),
  );
}
