import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";
import { TreeGridRowContext, treeGridRowKey, useTreeGridContext } from "./tree-grid-shared.js";

export type TreeGridRowProps = ComponentProps<"tr"> &
  AsProp & {
    /** Data-row identity used for selection, expansion, and hierarchy. Omit for a column-header row. */
    value?: string | undefined;
    /** The value of this row's parent. Rows remain flat in DOM order. */
    parentValue?: string | undefined;
    disabled?: boolean | undefined;
  };

export function TreeGridRow({
  as,
  value,
  parentValue,
  disabled,
  hidden,
  onClick,
  onFocus,
  children,
  ref,
  ...props
}: TreeGridRowProps) {
  const treeGrid = useTreeGridContext("TreeGridRow");
  const { rows } = treeGrid;
  const resolvedDisabled = Boolean(disabled);
  const metadata = value ? treeGrid.rowMetadata.get(value) : undefined;
  const selected = Boolean(value && treeGrid.selectedKey === value);
  const open = Boolean(value && treeGrid.open.includes(value));
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const composedRef = useComposedRefs(rowRef, ref);
  const rowHidden = Boolean(hidden);

  useLayoutEffect(() => {
    const element = rowRef.current;
    if (!value || !element) return;
    const registered = rows.get(value);
    if (registered?.element && registered.element !== element) {
      throw new Error(`TreeGridRow value "${value}" is rendered more than once.`);
    }
    rows.register({
      key: value,
      textValue: "",
      element,
      disabled: resolvedDisabled,
      parentValue,
      hidden: rowHidden,
    });
    return () => {
      rows.unregister(value, element);
    };
  }, [rowHidden, parentValue, resolvedDisabled, rows, value]);

  const fromInteractiveDescendant = (event: ReactMouseEvent<HTMLTableRowElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const focusable = target?.closest<HTMLElement>(FOCUSABLE_SELECTOR);
    if (!focusable || focusable === event.currentTarget) return false;
    return focusable.getAttribute("role") !== "gridcell";
  };

  let tabIndex: number | undefined;
  if (value && !resolvedDisabled) {
    tabIndex = treeGrid.activeKey === treeGridRowKey(value) ? 0 : -1;
  }
  const hiddenByAncestor = Boolean(value && metadata && !metadata.visible);
  const rowContext = { value, disabled: resolvedDisabled };

  const Part = partElement(as, "tr");
  return (
    <TreeGridRowContext value={rowContext}>
      <Part
        {...props}
        ref={composedRef}
        role="row"
        tabIndex={tabIndex}
        hidden={rowHidden || hiddenByAncestor}
        aria-level={metadata?.level}
        aria-posinset={metadata?.position}
        aria-setsize={metadata?.setSize}
        aria-expanded={metadata?.expandable ? open : undefined}
        aria-selected={selected || undefined}
        aria-disabled={resolvedDisabled || undefined}
        data-value={value}
        data-selected={dataAttr(selected)}
        data-open={dataAttr(Boolean(metadata?.expandable && open))}
        data-disabled={dataAttr(resolvedDisabled)}
        onFocus={(event: FocusEvent<HTMLTableRowElement>) => {
          onFocus?.(event);
          if (
            !event.defaultPrevented &&
            value &&
            !resolvedDisabled &&
            event.target === event.currentTarget
          ) {
            treeGrid.setActiveKey(treeGridRowKey(value));
          }
        }}
        onClick={(event: ReactMouseEvent<HTMLTableRowElement>) => {
          onClick?.(event);
          if (event.defaultPrevented || !value || fromInteractiveDescendant(event)) return;
          if (resolvedDisabled) {
            event.preventDefault();
            return;
          }
          const target = event.target instanceof HTMLElement ? event.target : null;
          const cell = target?.closest<HTMLTableCellElement>('td[role="gridcell"]');
          const cellKey = cell ? treeGrid.keyForCell(cell) : undefined;
          treeGrid.setActiveKey(cellKey ?? treeGridRowKey(value));
          treeGrid.setSelectedKey(value);
          if (metadata?.expandable) treeGrid.toggleOpen(value);
        }}
      >
        {children}
      </Part>
    </TreeGridRowContext>
  );
}
