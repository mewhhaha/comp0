import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import {
  findTypeaheadMatch,
  getRovingFocusTarget,
  useControllableState,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { VisuallyHidden } from "./VisuallyHidden.js";
import {
  GridListContext,
  GridListDndContext,
  rowFocusables,
  type GridListDndContextValue,
  type GridListDropTarget,
} from "./grid-list-shared.js";

export type GridListProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  /** Receives the full new order of row values; providing it makes rows draggable and movable with Alt+Arrow keys. */
  onReorder?: ((values: string[]) => void) | undefined;
};

export function GridList({
  value,
  defaultValue,
  onChange,
  onDragLeave,
  onKeyDown,
  onReorder,
  children,
  ref,
  ...props
}: GridListProps & RefProp<HTMLDivElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const typeaheadSearch = useTypeaheadSearch();
  const [activeKey, setActiveKey] = useState(selected);
  const [dragValue, setDragValue] = useState("");
  const [dropTarget, setDropTargetState] = useState<GridListDropTarget | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());

  useEffect(() => {
    selectedRef.current = selected;
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const register = (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => {
    if (!element) {
      itemMap.current.delete(key);
      return;
    }
    itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
    if (!selectedRef.current && !activeKeyRef.current && !disabled) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  };

  const items = () => sortItems([...itemMap.current.values()]);

  const context: SelectableCollectionContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey,
    setSelectedKey: setSelected,
    register,
    items,
  };

  const focusRow = (key: string | undefined) => {
    if (!key) return false;
    const row = itemMap.current.get(key)?.element;
    if (!row) return false;
    setActiveKey(key);
    row.focus();
    return true;
  };

  const resetDrag = () => {
    setDragValue("");
    setDropTargetState(null);
  };

  const announceMove = (movedValue: string, order: string[]) => {
    const label = itemMap.current.get(movedValue)?.textValue ?? movedValue;
    setAnnouncement(
      `Moved ${label} to position ${order.indexOf(movedValue) + 1} of ${order.length}.`,
    );
  };

  // Reordered rows keep their element, but browsers can drop focus when a
  // focused node moves in the DOM; put it back after React commits.
  const refocusAfterReorder = (movedValue: string) => {
    setTimeout(() => {
      const row = itemMap.current.get(movedValue)?.element;
      if (row?.isConnected) {
        setActiveKey(movedValue);
        row.focus();
      }
    });
  };

  const moveItem = (movedValue: string, delta: -1 | 1) => {
    if (!onReorder) return;
    const order = items().map((item) => item.key);
    const from = order.indexOf(movedValue);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    order.splice(from, 1);
    order.splice(to, 0, movedValue);
    onReorder(order);
    announceMove(movedValue, order);
    refocusAfterReorder(movedValue);
  };

  const commitDrop = () => {
    if (!onReorder || !dragValue || !dropTarget || dropTarget.value === dragValue) {
      resetDrag();
      return;
    }
    const current = items().map((item) => item.key);
    const order = current.filter((key) => key !== dragValue);
    const targetIndex = order.indexOf(dropTarget.value);
    if (targetIndex < 0) {
      resetDrag();
      return;
    }
    order.splice(dropTarget.edge === "before" ? targetIndex : targetIndex + 1, 0, dragValue);
    if (order.some((key, index) => key !== current[index])) {
      onReorder(order);
      announceMove(dragValue, order);
    }
    resetDrag();
  };

  let dndContext: GridListDndContextValue | null = null;
  if (onReorder) {
    dndContext = {
      dragValue,
      dropTarget,
      startDrag: setDragValue,
      setDropTarget: setDropTargetState,
      commitDrop,
      endDrag: resetDrag,
      moveItem,
    };
  }

  return (
    <GridListContext value={context}>
      <GridListDndContext value={dndContext}>
        <div
          {...props}
          ref={ref}
          role="grid"
          onDragLeave={(event) => {
            onDragLeave?.(event);
            if (event.defaultPrevented || !dndContext) return;
            // Leaving the grid entirely clears the drop preview.
            const next = event.relatedTarget;
            if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
              setDropTargetState(null);
            }
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (!target) return;
            const rows = items();
            const rowRecord = rows.find((item) => item.element?.contains(target));
            if (!rowRecord?.element) return;
            const row = rowRecord.element;
            const insideRow = target !== row;
            const focusables = rowFocusables(row);

            if (
              dndContext &&
              !insideRow &&
              !rowRecord.disabled &&
              event.altKey &&
              (event.key === "ArrowUp" || event.key === "ArrowDown")
            ) {
              event.preventDefault();
              moveItem(rowRecord.key, event.key === "ArrowUp" ? -1 : 1);
              return;
            }
            if (event.key === "ArrowRight") {
              // Right steps into and through the row's interactive children.
              const index = insideRow ? focusables.indexOf(target) : -1;
              const next = focusables[index + 1];
              if (next) {
                event.preventDefault();
                next.focus();
              }
              return;
            }
            if (event.key === "ArrowLeft") {
              if (!insideRow) return;
              event.preventDefault();
              const index = focusables.indexOf(target);
              const previous = focusables[index - 1];
              if (previous) previous.focus();
              else row.focus();
              return;
            }
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              const key = getRovingFocusTarget(rows, rowRecord.key, event.key, {
                orientation: "vertical",
              });
              if (key) {
                event.preventDefault();
                focusRow(key);
              }
              return;
            }
            if (!insideRow && (event.key === "Enter" || event.key === " ")) {
              if (rowRecord.disabled) return;
              event.preventDefault();
              setActiveKey(rowRecord.key);
              setSelected(rowRecord.key);
              return;
            }
            if (!insideRow && event.key.length === 1) {
              const key = findTypeaheadMatch(rows, typeaheadSearch(event.key), rowRecord.key);
              if (key) {
                event.preventDefault();
                focusRow(key);
              }
            }
          }}
        >
          {children}
          {dndContext && <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>}
        </div>
      </GridListDndContext>
    </GridListContext>
  );
}
