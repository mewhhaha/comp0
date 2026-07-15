import {
  useContext,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { FOCUSABLE_SELECTOR } from "./grid-list-shared.js";
import {
  TreeGridContext,
  TreeGridRowContext,
  treeGridRowKey,
  type TreeGridContextValue,
  type TreeGridRowRecord,
} from "./tree-grid-shared.js";

export type TreeGridRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Data-row identity used for selection, expansion, and hierarchy. Omit for a column-header row. */
  value?: string | undefined;
  /** The value of this row's parent. Rows remain flat in DOM order. */
  parentValue?: string | undefined;
  disabled?: boolean | undefined;
};

export function TreeGridRow({
  value,
  parentValue,
  disabled,
  hidden,
  onClick,
  onFocus,
  children,
  ref,
  ...props
}: TreeGridRowProps & RefProp<HTMLTableRowElement>) {
  const treeGrid = useContext(TreeGridContext);
  const resolvedDisabled = Boolean(disabled);
  const metadata = value ? treeGrid?.rowMetadata.get(value) : undefined;
  const selected = Boolean(value && treeGrid?.selectedKey === value);
  const expanded = Boolean(value && treeGrid?.expanded.includes(value));
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const registeredRow = useRef<{
    treeGrid: TreeGridContextValue;
    value: string;
    element: HTMLTableRowElement;
  } | null>(null);

  const registerRowRef = (element: HTMLTableRowElement | null) => {
    rowRef.current = element;
    if (!element) {
      const registered = registeredRow.current;
      registered?.treeGrid.registerRow(null, registered.value, registered.element);
      registeredRow.current = null;
      return;
    }
    if (!treeGrid || !value) return;
    const record: TreeGridRowRecord = {
      value,
      parentValue,
      element,
      disabled: resolvedDisabled,
      hidden: Boolean(hidden),
    };
    treeGrid.registerRow(record, value);
    registeredRow.current = { treeGrid, value, element };
  };

  useLayoutEffect(() => {
    const element = rowRef.current;
    const registered = registeredRow.current;
    if (registered && (registered.treeGrid !== treeGrid || registered.value !== value)) {
      registered.treeGrid.registerRow(null, registered.value, registered.element);
      registeredRow.current = null;
    }
    if (!treeGrid || !value || !element) return;
    treeGrid.registerRow(
      {
        value,
        parentValue,
        element,
        disabled: resolvedDisabled,
        hidden: Boolean(hidden),
      },
      value,
    );
    registeredRow.current = { treeGrid, value, element };
  }, [hidden, parentValue, resolvedDisabled, treeGrid, value]);

  const fromInteractiveDescendant = (event: ReactMouseEvent<HTMLTableRowElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const focusable = target?.closest<HTMLElement>(FOCUSABLE_SELECTOR);
    if (!focusable || focusable === event.currentTarget) return false;
    return focusable.getAttribute("role") !== "gridcell";
  };

  let tabIndex: number | undefined;
  if (value && !resolvedDisabled) {
    tabIndex = treeGrid?.activeKey === treeGridRowKey(value) ? 0 : -1;
  }
  const rowHidden = Boolean(hidden || (value && metadata && !metadata.visible));
  const rowContext = { value, disabled: resolvedDisabled };

  return (
    <TreeGridRowContext value={rowContext}>
      <tr
        {...props}
        ref={useComposedRefs(registerRowRef, ref)}
        role="row"
        tabIndex={tabIndex}
        hidden={rowHidden}
        aria-level={metadata?.level}
        aria-posinset={metadata?.position}
        aria-setsize={metadata?.setSize}
        aria-expanded={metadata?.expandable ? expanded : undefined}
        aria-selected={selected || undefined}
        aria-disabled={resolvedDisabled || undefined}
        data-value={value}
        data-parent-value={parentValue}
        data-level={metadata?.level}
        data-selected={dataAttr(selected)}
        data-expanded={dataAttr(Boolean(metadata?.expandable && expanded))}
        data-disabled={dataAttr(resolvedDisabled)}
        onFocus={(event) => {
          onFocus?.(event);
          if (
            !event.defaultPrevented &&
            value &&
            !resolvedDisabled &&
            event.target === event.currentTarget
          ) {
            treeGrid?.setActiveKey(treeGridRowKey(value));
          }
        }}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || !value || fromInteractiveDescendant(event)) return;
          if (resolvedDisabled) {
            event.preventDefault();
            return;
          }
          const target = event.target instanceof HTMLElement ? event.target : null;
          const cell = target?.closest<HTMLTableCellElement>('td[role="gridcell"]');
          const cellKey = cell ? treeGrid?.keyForCell(cell) : undefined;
          treeGrid?.setActiveKey(cellKey ?? treeGridRowKey(value));
          treeGrid?.setSelectedKey(value);
          if (metadata?.expandable) treeGrid?.toggleExpanded(value);
        }}
      >
        {children}
      </tr>
    </TreeGridRowContext>
  );
}
