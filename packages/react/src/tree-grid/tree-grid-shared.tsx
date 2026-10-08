import { createContext } from "react";
import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

/** A registered data row; `key` is the row's public `value`. */
export type TreeGridRowItem = CollectionItem & {
  element: HTMLTableRowElement | null;
  parentValue: string | undefined;
  hidden: boolean;
};

/** A registered gridcell; `key` is the cell's generated id. */
export type TreeGridCellItem = CollectionItem & {
  element: HTMLTableCellElement | null;
  rowValue: string;
};

export type TreeGridRowMetadata = {
  parentValue: string | undefined;
  level: number;
  position: number;
  setSize: number;
  expandable: boolean;
  visible: boolean;
};

export type TreeGridContextValue = {
  activeKey: string;
  selectedKey: string;
  open: string[];
  rowMetadata: ReadonlyMap<string, TreeGridRowMetadata>;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  toggleOpen: (value: string) => void;
  rows: Collection<TreeGridRowItem>;
  cells: Collection<TreeGridCellItem>;
  keyForCell: (element: HTMLTableCellElement) => string | undefined;
};

export const [TreeGridContext, useTreeGridContext, useOptionalTreeGridContext] =
  createRequiredContext<TreeGridContextValue>("TreeGrid");

export type TreeGridRowContextValue = {
  value: string | undefined;
  disabled: boolean;
};

export const TreeGridRowContext = createContext<TreeGridRowContextValue>({
  value: undefined,
  disabled: false,
});

export function treeGridRowKey(value: string) {
  return `row:${value}`;
}
