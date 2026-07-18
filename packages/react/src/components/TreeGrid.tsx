import { useEffect, useLayoutEffect, useRef, useState, type TableHTMLAttributes } from "react";
import { useComposedRefs, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { sortItems } from "./collection-shared.js";
import { FOCUSABLE_SELECTOR } from "./grid-list-shared.js";
import {
  TreeGridContext,
  treeGridRowKey,
  type TreeGridCellRecord,
  type TreeGridContextValue,
  type TreeGridRowMetadata,
  type TreeGridRowRecord,
} from "./tree-grid-shared.js";
import { writingDirection } from "./writing-direction.js";

export type TreeGridProps = Omit<
  TableHTMLAttributes<HTMLTableElement>,
  "defaultValue" | "onChange"
> & {
  /** Controlled or initial selected row; selection is single. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected row's value. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial expanded parent-row values. */
  expanded?: string[] | undefined;
  defaultExpanded?: string[] | undefined;
  onExpandedChange?: ((expanded: string[]) => void) | undefined;
};

export function TreeGrid({
  value,
  defaultValue,
  onChange,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  onKeyDown,
  children,
  ref,
  ...props
}: TreeGridProps & RefProp<HTMLTableElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [expanded, setExpanded] = useControllableState<string[]>({
    value: expandedProp,
    defaultValue: defaultExpanded ?? [],
    onChange: onExpandedChange,
  });
  const [activeKey, setActiveKey] = useState(selected ? treeGridRowKey(selected) : "");
  const [rowMetadata, setRowMetadata] = useState<ReadonlyMap<string, TreeGridRowMetadata>>(
    new Map(),
  );
  const activeKeyRef = useRef(activeKey);
  const rowMap = useRef(new Map<string, TreeGridRowRecord>());
  const cellMap = useRef(new Map<string, TreeGridCellRecord>());
  const suppressedWidgetTabIndex = useRef(new WeakMap<HTMLElement, string | null>());
  const tableRef = useRef<HTMLTableElement | null>(null);

  const orderedRows = () => sortItems([...rowMap.current.values()]);
  const visibleRows = () =>
    orderedRows().filter((row) => rowMetadata.get(row.value)?.visible && !row.disabled);

  const syncTabStops = (key: string) => {
    const activeCell = cellMap.current.get(key);
    let activeRowValue = activeCell?.rowValue;
    if (!activeRowValue) {
      activeRowValue = [...rowMap.current.values()].find(
        (row) => treeGridRowKey(row.value) === key,
      )?.value;
    }
    for (const row of rowMap.current.values()) {
      if (row.disabled) row.element.removeAttribute("tabindex");
      else row.element.tabIndex = treeGridRowKey(row.value) === key ? 0 : -1;
      const widgets = [...row.element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (element) => element.getAttribute("role") !== "gridcell",
      );
      for (const widget of widgets) {
        if (row.value === activeRowValue && !row.disabled) {
          if (!suppressedWidgetTabIndex.current.has(widget)) continue;
          const tabIndex = suppressedWidgetTabIndex.current.get(widget);
          if (tabIndex === null) widget.removeAttribute("tabindex");
          else if (tabIndex !== undefined) widget.setAttribute("tabindex", tabIndex);
          suppressedWidgetTabIndex.current.delete(widget);
          continue;
        }
        if (!suppressedWidgetTabIndex.current.has(widget)) {
          suppressedWidgetTabIndex.current.set(widget, widget.getAttribute("tabindex"));
        }
        widget.tabIndex = -1;
      }
    }
    for (const cell of cellMap.current.values()) {
      const row = rowMap.current.get(cell.rowValue);
      if (!row || row.disabled) cell.element.removeAttribute("tabindex");
      else cell.element.tabIndex = cell.key === key ? 0 : -1;
    }
  };

  const activate = (key: string) => {
    activeKeyRef.current = key;
    syncTabStops(key);
    setActiveKey(key);
  };

  const registerRow = (
    record: TreeGridRowRecord | null,
    rowValue: string,
    removedElement?: HTMLTableRowElement,
  ) => {
    if (!record) {
      const registered = rowMap.current.get(rowValue);
      if (removedElement && registered?.element !== removedElement) return;
      rowMap.current.delete(rowValue);
      return;
    }
    const registered = rowMap.current.get(rowValue);
    if (registered?.element && registered.element !== record.element) {
      throw new Error(`TreeGridRow value "${rowValue}" is rendered more than once.`);
    }
    rowMap.current.set(rowValue, record);
  };

  const registerCell = (
    record: TreeGridCellRecord | null,
    key: string,
    removedElement?: HTMLTableCellElement,
  ) => {
    if (!record) {
      const registered = cellMap.current.get(key);
      if (removedElement && registered?.element !== removedElement) return;
      cellMap.current.delete(key);
      return;
    }
    cellMap.current.set(key, record);
  };

  const keyForCell = (element: HTMLTableCellElement) => {
    for (const [key, cell] of cellMap.current) if (cell.element === element) return key;
    return undefined;
  };

  const setRowExpanded = (rowValue: string, nextExpanded: boolean) => {
    setExpanded((current) => {
      const has = current.includes(rowValue);
      if (nextExpanded && !has) return [...current, rowValue];
      if (!nextExpanded && has) return current.filter((entry) => entry !== rowValue);
      return current;
    });
  };

  const toggleExpanded = (rowValue: string) => {
    setExpanded((current) => {
      if (current.includes(rowValue)) return current.filter((entry) => entry !== rowValue);
      return [...current, rowValue];
    });
  };

  const focusRow = (row: TreeGridRowRecord | undefined) => {
    if (!row || row.disabled) return false;
    activate(treeGridRowKey(row.value));
    row.element.focus();
    return true;
  };

  const focusCell = (cell: HTMLTableCellElement | undefined) => {
    if (!cell) return false;
    const key = keyForCell(cell);
    if (!key) return false;
    activate(key);
    cell.focus();
    return true;
  };

  useEffect(() => {
    if (!selected) return;
    const row = rowMap.current.get(selected);
    if (!row || row.disabled || row.element.hidden) return;
    activate(treeGridRowKey(selected));
  }, [selected]);

  // Registrations are ref-backed and can change on any commit. Recompute the
  // hierarchy and validate the one roving stop after children have committed.
  useLayoutEffect(() => {
    const rows = orderedRows();
    const rowByValue = new Map(rows.map((row) => [row.value, row]));
    const childrenByParent = new Map<string | undefined, TreeGridRowRecord[]>();
    for (const row of rows) {
      const siblings = childrenByParent.get(row.parentValue) ?? [];
      siblings.push(row);
      childrenByParent.set(row.parentValue, siblings);
    }
    const nextMetadata = new Map<string, TreeGridRowMetadata>();
    const resolving = new Set<string>();
    const resolveMetadata = (row: TreeGridRowRecord): TreeGridRowMetadata => {
      const resolved = nextMetadata.get(row.value);
      if (resolved) return resolved;
      if (resolving.has(row.value)) {
        throw new Error(`TreeGridRow value "${row.value}" has a cyclic parentValue chain.`);
      }
      resolving.add(row.value);
      let level = 1;
      let visible = !row.hidden;
      if (row.parentValue !== undefined) {
        const parent = rowByValue.get(row.parentValue);
        if (!parent) {
          throw new Error(
            `TreeGridRow value "${row.value}" references missing parentValue "${row.parentValue}".`,
          );
        }
        const parentMetadata = resolveMetadata(parent);
        level = parentMetadata.level + 1;
        visible = visible && parentMetadata.visible && expanded.includes(parent.value);
      }
      const siblings = childrenByParent.get(row.parentValue) ?? [];
      const metadata: TreeGridRowMetadata = {
        parentValue: row.parentValue,
        level,
        position: siblings.indexOf(row) + 1,
        setSize: siblings.length,
        expandable: childrenByParent.has(row.value),
        visible,
      };
      nextMetadata.set(row.value, metadata);
      resolving.delete(row.value);
      return metadata;
    };
    for (const row of rows) resolveMetadata(row);

    setRowMetadata((current) => {
      if (current.size !== nextMetadata.size) return nextMetadata;
      for (const [rowValue, next] of nextMetadata) {
        const previous = current.get(rowValue);
        if (
          !previous ||
          previous.parentValue !== next.parentValue ||
          previous.level !== next.level ||
          previous.position !== next.position ||
          previous.setSize !== next.setSize ||
          previous.expandable !== next.expandable ||
          previous.visible !== next.visible
        ) {
          return nextMetadata;
        }
      }
      return current;
    });

    const activeCell = cellMap.current.get(activeKeyRef.current);
    let activeRow = activeCell ? rowByValue.get(activeCell.rowValue) : undefined;
    if (!activeRow) {
      activeRow = rows.find((row) => treeGridRowKey(row.value) === activeKeyRef.current);
    }
    const activeMetadata = activeRow ? nextMetadata.get(activeRow.value) : undefined;
    let nextActiveKey = activeKeyRef.current;
    if (!activeRow || activeRow.disabled || !activeMetadata?.visible) {
      const first = rows.find((row) => !row.disabled && nextMetadata.get(row.value)?.visible);
      nextActiveKey = first ? treeGridRowKey(first.value) : "";
    }
    if (nextActiveKey !== activeKeyRef.current) {
      activeKeyRef.current = nextActiveKey;
      setActiveKey(nextActiveKey);
    }
    syncTabStops(nextActiveKey);
  });

  const context: TreeGridContextValue = {
    activeKey,
    selectedKey: selected,
    expanded,
    rowMetadata,
    setActiveKey: activate,
    setSelectedKey: setSelected,
    toggleExpanded,
    registerRow,
    registerCell,
    keyForCell,
  };

  return (
    <TreeGridContext value={context}>
      <table
        {...props}
        ref={useComposedRefs(tableRef, ref)}
        role="treegrid"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.altKey || event.metaKey || event.shiftKey) return;
          if (event.ctrlKey && event.key !== "Home" && event.key !== "End") return;
          const table = tableRef.current;
          const target = event.target instanceof HTMLElement ? event.target : null;
          const rowElement = target?.closest<HTMLTableRowElement>('tr[role="row"][data-value]');
          if (!table || !target || !rowElement || !table.contains(rowElement)) return;
          const rowValue = rowElement.dataset["value"];
          if (!rowValue) return;
          const row = rowMap.current.get(rowValue);
          if (!row || row.disabled) return;
          const cellElement = target.closest<HTMLTableCellElement>('td[role="gridcell"]');
          const rowFocused = target === rowElement;
          const cellFocused = target === cellElement;
          // A widget inside a cell owns its keyboard contract.
          if (!rowFocused && !cellFocused) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelected(row.value);
            return;
          }

          const rows = visibleRows();
          const rowIndex = rows.indexOf(row);
          const metadata = rowMetadata.get(row.value);
          let moved = false;
          const rtl = writingDirection(event.currentTarget) === "rtl";
          const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
          const collapseKey = rtl ? "ArrowRight" : "ArrowLeft";

          if (event.key === expandKey) {
            if (rowFocused) {
              // Rows-first APG model: expansion stays in row mode, while a
              // second Right Arrow enters the row's first cell.
              if (metadata?.expandable && !expanded.includes(row.value)) {
                setRowExpanded(row.value, true);
                moved = true;
              } else {
                moved = focusCell(
                  [...row.element.cells].find((cell) => cell.getAttribute("role") === "gridcell"),
                );
              }
            } else if (cellElement) {
              const next = row.element.cells[cellElement.cellIndex + 1];
              if (next?.getAttribute("role") === "gridcell") moved = focusCell(next);
            }
          } else if (event.key === collapseKey) {
            if (rowFocused) {
              if (metadata?.expandable && expanded.includes(row.value)) {
                setRowExpanded(row.value, false);
                moved = true;
              } else if (metadata?.parentValue) {
                moved = focusRow(rowMap.current.get(metadata.parentValue));
              }
            } else if (cellElement) {
              const previous = row.element.cells[cellElement.cellIndex - 1];
              if (previous?.getAttribute("role") === "gridcell") moved = focusCell(previous);
              // The first cell is the bridge back to hierarchical row focus.
              else moved = focusRow(row);
            }
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const delta = event.key === "ArrowDown" ? 1 : -1;
            const nextRow = rows[rowIndex + delta];
            if (rowFocused) moved = focusRow(nextRow);
            else if (cellElement && nextRow) {
              const nextCell = nextRow.element.cells[cellElement.cellIndex];
              if (nextCell?.getAttribute("role") === "gridcell") moved = focusCell(nextCell);
            }
          } else if (event.key === "Home" || event.key === "End") {
            const edgeRow = event.key === "Home" ? rows[0] : rows.at(-1);
            if (rowFocused) {
              moved = focusRow(edgeRow);
            } else if (cellElement && event.ctrlKey && edgeRow) {
              // Treegrid differs from a generic data grid here: Ctrl+Home/End
              // preserves the focused column instead of moving to a corner.
              const edgeCell = edgeRow.element.cells[cellElement.cellIndex];
              if (edgeCell?.getAttribute("role") === "gridcell") moved = focusCell(edgeCell);
            } else if (cellElement) {
              const cells = [...row.element.cells].filter(
                (cell) => cell.getAttribute("role") === "gridcell",
              );
              moved = focusCell(event.key === "Home" ? cells[0] : cells.at(-1));
            }
          }

          if (moved) event.preventDefault();
        }}
      >
        {children}
      </table>
    </TreeGridContext>
  );
}
