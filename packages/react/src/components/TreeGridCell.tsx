import { useContext, useId, useLayoutEffect, useRef, type TdHTMLAttributes } from "react";
import { useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  TreeGridContext,
  TreeGridRowContext,
  type TreeGridCellRecord,
  type TreeGridContextValue,
} from "./tree-grid-shared.js";

export type TreeGridCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function TreeGridCell({
  onFocus,
  ref,
  ...props
}: TreeGridCellProps & RefProp<HTMLTableCellElement>) {
  const treeGrid = useContext(TreeGridContext);
  const row = useContext(TreeGridRowContext);
  const generatedId = useId().replace(/:/g, "");
  const key = `tree-grid-cell-${generatedId}`;
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const registeredCell = useRef<{
    treeGrid: TreeGridContextValue;
    key: string;
    element: HTMLTableCellElement;
  } | null>(null);

  const registerCellRef = (element: HTMLTableCellElement | null) => {
    cellRef.current = element;
    if (!element) {
      const registered = registeredCell.current;
      registered?.treeGrid.registerCell(null, registered.key, registered.element);
      registeredCell.current = null;
      return;
    }
    if (!treeGrid || !row.value) return;
    const record: TreeGridCellRecord = { key, rowValue: row.value, element };
    treeGrid.registerCell(record, key);
    registeredCell.current = { treeGrid, key, element };
  };

  useLayoutEffect(() => {
    const element = cellRef.current;
    const registered = registeredCell.current;
    if (registered && (registered.treeGrid !== treeGrid || !row.value)) {
      registered.treeGrid.registerCell(null, registered.key, registered.element);
      registeredCell.current = null;
    }
    if (!treeGrid || !row.value || !element) return;
    treeGrid.registerCell({ key, rowValue: row.value, element }, key);
    registeredCell.current = { treeGrid, key, element };
  }, [key, row.value, treeGrid]);

  let tabIndex: number | undefined;
  if (row.value && !row.disabled) tabIndex = treeGrid?.activeKey === key ? 0 : -1;

  return (
    <td
      {...props}
      ref={useComposedRefs(registerCellRef, ref)}
      role="gridcell"
      tabIndex={tabIndex}
      onFocus={(event) => {
        onFocus?.(event);
        if (
          !event.defaultPrevented &&
          row.value &&
          !row.disabled &&
          event.target === event.currentTarget
        ) {
          treeGrid?.setActiveKey(key);
        }
      }}
    />
  );
}
