import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import {
  useCollection,
  useCollectionNavigation,
  useComposedRefs,
  useControllableState,
} from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";
import {
  TreeGridContext,
  treeGridRowKey,
  type TreeGridCellItem,
  type TreeGridContextValue,
  type TreeGridRowItem,
  type TreeGridRowMetadata,
} from "./tree-grid-shared.js";
import { useWarnOnce } from "../internal/dev.js";
import { writingDirection } from "../internal/writing-direction.js";

type MountedRow = TreeGridRowItem & { element: HTMLTableRowElement };
type MountedCell = TreeGridCellItem & { element: HTMLTableCellElement };

export type TreeGridProps = Omit<ComponentProps<"table">, "defaultValue" | "onChange"> &
  AsProp & {
    /** Controlled or initial selected row; selection is single. */
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the selected row's value. */
    onChange?: ((value: string) => void) | undefined;
    /** Controlled or initial values of the open (expanded) parent rows. */
    open?: string[] | undefined;
    defaultOpen?: string[] | undefined;
    /** Receives the next list of open row values. */
    onOpenChange?: ((open: string[]) => void) | undefined;
  };

export function TreeGrid({
  as,
  value,
  defaultValue,
  onChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  onKeyDown,
  children,
  ref,
  ...props
}: TreeGridProps) {
  const warn = useWarnOnce();
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [open, setOpen] = useControllableState<string[]>({
    value: openProp,
    defaultValue: defaultOpen ?? [],
    onChange: onOpenChange,
  });
  const [activeKey, setActiveKey] = useState(selected ? treeGridRowKey(selected) : "");
  const [rowMetadata, setRowMetadata] = useState<ReadonlyMap<string, TreeGridRowMetadata>>(
    new Map(),
  );
  const activeKeyRef = useRef(activeKey);
  const rowCollection = useCollection<TreeGridRowItem>();
  const cellCollection = useCollection<TreeGridCellItem>();
  const navigate = useCollectionNavigation();
  const suppressedWidgetTabIndex = useRef(new WeakMap<HTMLElement, string | null>());
  const tableRef = useRef<HTMLTableElement | null>(null);
  const composedRef = useComposedRefs(tableRef, ref);

  const orderedRows = () =>
    rowCollection.items().filter((row): row is MountedRow => row.element !== null);
  const orderedCells = () =>
    cellCollection.items().filter((cell): cell is MountedCell => cell.element !== null);
  const visibleRows = () =>
    orderedRows().filter((row) => rowMetadata.get(row.key)?.visible && !row.disabled);

  const syncTabStops = (key: string) => {
    const cells = orderedCells();
    const rows = orderedRows();
    const activeCell = cells.find((cell) => cell.key === key);
    let activeRowValue = activeCell?.rowValue;
    if (!activeRowValue) activeRowValue = rows.find((row) => treeGridRowKey(row.key) === key)?.key;
    for (const row of rows) {
      if (row.disabled) row.element.removeAttribute("tabindex");
      else row.element.tabIndex = treeGridRowKey(row.key) === key ? 0 : -1;
      const widgets = [...row.element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (element) => element.getAttribute("role") !== "gridcell",
      );
      for (const widget of widgets) {
        if (row.key === activeRowValue && !row.disabled) {
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
    for (const cell of cells) {
      const row = rowCollection.get(cell.rowValue);
      if (!row || row.disabled) cell.element.removeAttribute("tabindex");
      else cell.element.tabIndex = cell.key === key ? 0 : -1;
    }
  };

  const activate = (key: string) => {
    activeKeyRef.current = key;
    syncTabStops(key);
    setActiveKey(key);
  };

  const keyForCell = (element: HTMLTableCellElement) =>
    orderedCells().find((cell) => cell.element === element)?.key;

  const setRowOpen = (rowValue: string, nextOpen: boolean) => {
    setOpen((current) => {
      const has = current.includes(rowValue);
      if (nextOpen && !has) return [...current, rowValue];
      if (!nextOpen && has) return current.filter((entry) => entry !== rowValue);
      return current;
    });
  };

  const toggleOpen = (rowValue: string) => {
    setOpen((current) => {
      if (current.includes(rowValue)) return current.filter((entry) => entry !== rowValue);
      return [...current, rowValue];
    });
  };

  const focusRow = (row: TreeGridRowItem | undefined) => {
    if (!row?.element || row.disabled) return false;
    activate(treeGridRowKey(row.key));
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
    const row = rowCollection.get(selected);
    if (!row?.element || row.disabled || row.element.hidden) return;
    activate(treeGridRowKey(selected));
  }, [selected]);

  // Registrations change on any commit. Recompute the hierarchy and validate
  // the one roving stop after children have committed.
  useLayoutEffect(() => {
    const rows = orderedRows();
    const rowByValue = new Map(rows.map((row) => [row.key, row]));
    // Invalid hierarchy data degrades to a root row: a missing parent or a
    // cyclic parentValue chain is reported once and the row is lifted out.
    const parentOf = new Map<string, string | undefined>();
    for (const row of rows) {
      let parent = row.parentValue;
      if (parent !== undefined && !rowByValue.has(parent)) {
        warn(
          `TreeGridRow:missing-parent:${row.key}`,
          `TreeGridRow value "${row.key}" references missing parentValue "${parent}". It was treated as a root row.`,
        );
        parent = undefined;
      }
      parentOf.set(row.key, parent);
    }
    for (const row of rows) {
      const seen = new Set([row.key]);
      let ancestor = parentOf.get(row.key);
      while (ancestor !== undefined) {
        if (seen.has(ancestor)) {
          if (ancestor === row.key) {
            warn(
              `TreeGridRow:cyclic-parent:${row.key}`,
              `TreeGridRow value "${row.key}" has a cyclic parentValue chain. It was treated as a root row.`,
            );
            parentOf.set(row.key, undefined);
          }
          break;
        }
        seen.add(ancestor);
        ancestor = parentOf.get(ancestor);
      }
    }
    const childrenByParent = new Map<string | undefined, MountedRow[]>();
    for (const row of rows) {
      const parentKey = parentOf.get(row.key);
      const siblings = childrenByParent.get(parentKey) ?? [];
      siblings.push(row);
      childrenByParent.set(parentKey, siblings);
    }
    const nextMetadata = new Map<string, TreeGridRowMetadata>();
    const resolveMetadata = (row: MountedRow): TreeGridRowMetadata => {
      const resolved = nextMetadata.get(row.key);
      if (resolved) return resolved;
      const parentKey = parentOf.get(row.key);
      let level = 1;
      let visible = !row.hidden;
      const parent = parentKey === undefined ? undefined : rowByValue.get(parentKey);
      if (parent) {
        const parentMetadata = resolveMetadata(parent);
        level = parentMetadata.level + 1;
        visible = visible && parentMetadata.visible && open.includes(parent.key);
      }
      const siblings = childrenByParent.get(parentKey) ?? [];
      const metadata: TreeGridRowMetadata = {
        parentValue: parentKey,
        level,
        position: siblings.indexOf(row) + 1,
        setSize: siblings.length,
        expandable: childrenByParent.has(row.key),
        visible,
      };
      nextMetadata.set(row.key, metadata);
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

    const activeCell = cellCollection.get(activeKeyRef.current);
    let activeRow = activeCell ? rowByValue.get(activeCell.rowValue) : undefined;
    if (!activeRow) {
      activeRow = rows.find((row) => treeGridRowKey(row.key) === activeKeyRef.current);
    }
    const activeMetadata = activeRow ? nextMetadata.get(activeRow.key) : undefined;
    let nextActiveKey = activeKeyRef.current;
    if (!activeRow || activeRow.disabled || !activeMetadata?.visible) {
      const first = rows.find((row) => !row.disabled && nextMetadata.get(row.key)?.visible);
      nextActiveKey = first ? treeGridRowKey(first.key) : "";
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
    open,
    rowMetadata,
    setActiveKey: activate,
    setSelectedKey: setSelected,
    toggleOpen,
    rows: rowCollection,
    cells: cellCollection,
    keyForCell,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.ctrlKey && event.key !== "Home" && event.key !== "End") return;
    const table = tableRef.current;
    const target = event.target instanceof HTMLElement ? event.target : null;
    const rowElement = target?.closest("tr");
    if (!table || !target || !rowElement || !table.contains(rowElement)) return;
    const row = rowCollection.items().find((item) => item.element === rowElement);
    if (!row?.element || row.disabled) return;
    const cellElement = target.closest<HTMLTableCellElement>('td[role="gridcell"]');
    const rowFocused = target === rowElement;
    const cellFocused = target === cellElement;
    // A widget inside a cell owns its keyboard contract.
    if (!rowFocused && !cellFocused) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(row.key);
      return;
    }

    const rows = visibleRows();
    const metadata = rowMetadata.get(row.key);
    const rowCells = orderedCells().filter((cell) => cell.rowValue === row.key);
    const currentCell = rowCells.find((cell) => cell.element === cellElement);
    const rtl = writingDirection(event.currentTarget) === "rtl";
    const expandKey = rtl ? "ArrowLeft" : "ArrowRight";
    const collapseKey = rtl ? "ArrowRight" : "ArrowLeft";
    const verticalKey = (key: string) =>
      navigate(key, rows, row.key, { orientation: "vertical", typeahead: false });
    let moved = false;

    if (event.key === expandKey) {
      if (rowFocused) {
        // Rows-first APG model: expansion stays in row mode, while a
        // second Right Arrow enters the row's first cell.
        if (metadata?.expandable && !open.includes(row.key)) {
          setRowOpen(row.key, true);
          moved = true;
        } else {
          moved = focusCell(rowCells[0]?.element);
        }
      } else if (currentCell) {
        const next = navigate(event.key, rowCells, currentCell.key, {
          orientation: "horizontal",
          dir: rtl ? "rtl" : "ltr",
          typeahead: false,
        });
        if (next && next !== currentCell.key) {
          moved = focusCell(cellCollection.get(next)?.element ?? undefined);
        }
      }
    } else if (event.key === collapseKey) {
      if (rowFocused) {
        if (metadata?.expandable && open.includes(row.key)) {
          setRowOpen(row.key, false);
          moved = true;
        } else if (metadata?.parentValue) {
          moved = focusRow(rowCollection.get(metadata.parentValue));
        }
      } else if (currentCell) {
        const previous = navigate(event.key, rowCells, currentCell.key, {
          orientation: "horizontal",
          dir: rtl ? "rtl" : "ltr",
          typeahead: false,
        });
        if (previous && previous !== currentCell.key) {
          moved = focusCell(cellCollection.get(previous)?.element ?? undefined);
          // The first cell is the bridge back to hierarchical row focus.
        } else {
          moved = focusRow(row);
        }
      }
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const nextKey = verticalKey(event.key);
      const nextRow = nextKey && nextKey !== row.key ? rowCollection.get(nextKey) : undefined;
      if (rowFocused) {
        moved = focusRow(nextRow);
      } else if (cellElement && nextRow?.element) {
        const nextCell = nextRow.element.cells[cellElement.cellIndex];
        if (nextCell?.getAttribute("role") === "gridcell") moved = focusCell(nextCell);
      }
    } else if (event.key === "Home" || event.key === "End") {
      const edgeKey = verticalKey(event.key);
      const edgeRow = edgeKey ? rowCollection.get(edgeKey) : undefined;
      if (rowFocused) {
        moved = focusRow(edgeRow);
      } else if (cellElement && event.ctrlKey && edgeRow?.element) {
        // Treegrid differs from a generic data grid here: Ctrl+Home/End
        // preserves the focused column instead of moving to a corner.
        const edgeCell = edgeRow.element.cells[cellElement.cellIndex];
        if (edgeCell?.getAttribute("role") === "gridcell") moved = focusCell(edgeCell);
      } else if (currentCell) {
        const edge = navigate(event.key, rowCells, currentCell.key, {
          orientation: "horizontal",
          typeahead: false,
        });
        moved = focusCell(edge ? (cellCollection.get(edge)?.element ?? undefined) : undefined);
      }
    }

    if (moved) event.preventDefault();
  };

  const Part = partElement(as, "table");
  return (
    <TreeGridContext value={context}>
      <Part {...props} ref={composedRef} role="treegrid" onKeyDown={handleKeyDown}>
        {children}
      </Part>
    </TreeGridContext>
  );
}
