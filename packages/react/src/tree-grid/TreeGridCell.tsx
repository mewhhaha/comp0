import { use, useId, useLayoutEffect, useRef, type ComponentProps, type FocusEvent } from "react";
import { useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { TreeGridRowContext, useTreeGridContext } from "./tree-grid-shared.js";

export type TreeGridCellProps = ComponentProps<"td"> & AsProp;

export function TreeGridCell({ as, onFocus, ref, ...props }: TreeGridCellProps) {
  const treeGrid = useTreeGridContext("TreeGridCell");
  const row = use(TreeGridRowContext);
  const generatedId = useId().replace(/:/g, "");
  const key = `tree-grid-cell-${generatedId}`;
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const composedRef = useComposedRefs(cellRef, ref);
  const { cells } = treeGrid;

  useLayoutEffect(() => {
    const element = cellRef.current;
    if (!row.value || !element) return;
    cells.register({ key, textValue: "", element, rowValue: row.value });
    return () => {
      cells.unregister(key, element);
    };
  }, [cells, key, row.value]);

  let tabIndex: number | undefined;
  if (row.value && !row.disabled) tabIndex = treeGrid.activeKey === key ? 0 : -1;

  const Part = partElement(as, "td");
  return (
    <Part
      {...props}
      ref={composedRef}
      role="gridcell"
      tabIndex={tabIndex}
      onFocus={(event: FocusEvent<HTMLTableCellElement>) => {
        onFocus?.(event);
        if (
          !event.defaultPrevented &&
          row.value &&
          !row.disabled &&
          event.target === event.currentTarget
        ) {
          treeGrid.setActiveKey(key);
        }
      }}
    />
  );
}
