import { createContext } from "react";

export type TreeGridRowRecord = {
  value: string;
  parentValue: string | undefined;
  element: HTMLTableRowElement;
  disabled: boolean;
  hidden: boolean;
};

export type TreeGridCellRecord = {
  key: string;
  rowValue: string;
  element: HTMLTableCellElement;
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
  expanded: string[];
  rowMetadata: ReadonlyMap<string, TreeGridRowMetadata>;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  toggleExpanded: (value: string) => void;
  registerRow: (
    record: TreeGridRowRecord | null,
    value: string,
    removedElement?: HTMLTableRowElement,
  ) => void;
  registerCell: (
    record: TreeGridCellRecord | null,
    key: string,
    removedElement?: HTMLTableCellElement,
  ) => void;
  keyForCell: (element: HTMLTableCellElement) => string | undefined;
};

export const TreeGridContext = createContext<TreeGridContextValue | null>(null);

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
