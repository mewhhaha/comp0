import { cloneElement, Fragment, isValidElement, type ElementType, type ReactNode } from "react";
import { type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type GridListContextValue = {
  activeKey: string;
  selectedKey: string;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  /** Registers or updates one row; registering an unchanged row is a no-op. */
  register: (item: CollectionItem) => void;
  /** Removes a row, but only while `element` is still the registered one. */
  unregister: (key: string, element: HTMLElement) => void;
};

export const [GridListContext, useGridListContext] =
  createRequiredContext<GridListContextValue>("GridList");

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

export const [GridListReorderGroupContext, , useOptionalGridListReorderGroupContext] =
  createRequiredContext<GridListReorderGroupContextValue>("GridListReorderGroup");

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

export const [GridListDndContext, , useOptionalGridListDndContext] =
  createRequiredContext<GridListDndContextValue>("GridList");

export type GridListItemContextValue = {
  value: string;
  label: string;
  listName?: string | undefined;
  reorderable: boolean;
};

export const [GridListItemContext, , useOptionalGridListItemContext] =
  createRequiredContext<GridListItemContextValue>("GridListItem");

/**
 * A row's content wrapped in its gridcell. With `as={Fragment}` the row is the
 * single child element, so the cell goes inside that child instead.
 */
export function rowCell(as: ElementType | undefined, children: ReactNode, slot: string) {
  if (as === Fragment && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(
      children,
      undefined,
      <div role="gridcell" data-slot={slot}>
        {children.props.children}
      </div>,
    );
  }
  return (
    <div role="gridcell" data-slot={slot}>
      {children}
    </div>
  );
}
