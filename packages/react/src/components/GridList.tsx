import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  dataAttr,
  findTypeaheadMatch,
  getRovingFocusTarget,
  useComposedRefs,
  useControllableState,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";
import { VisuallyHidden } from "./VisuallyHidden.js";
import {
  GridListContext,
  GridListDndContext,
  GridListReorderGroupContext,
  rowFocusables,
  type GridListDndContextValue,
  type GridListDropTarget,
  type GridListFocusRequest,
  type GridListContextValue,
  type GridListReorderGroupContextValue,
} from "./grid-list-shared.js";

export type GridListProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  /** Column key when this list is inside GridListReorderGroup. */
  name?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  /** Receives the full new order of row values; providing it makes rows draggable and movable with Alt+Arrow keys. */
  onReorder?: ((values: string[]) => void) | undefined;
  /** Vetoes a proposed order before it is offered: blocked drop positions show no drop preview and blocked keyboard moves are announced but not applied. */
  canReorder?: ((values: string[], moved: string) => boolean) | undefined;
};

export function GridList({
  name,
  value,
  defaultValue,
  canReorder,
  onChange,
  onDragLeave,
  onDragOver,
  onDrop,
  onKeyDown,
  onReorder,
  children,
  ref,
  ...props
}: GridListProps & RefProp<HTMLDivElement>) {
  const reorderGroup = useContext(GridListReorderGroupContext);
  if (reorderGroup && !name) {
    throw new Error("GridList inside GridListReorderGroup requires a name matching its value key.");
  }
  if (reorderGroup && name && !reorderGroup.hasList(name)) {
    throw new Error(`GridList name "${name}" is missing from GridListReorderGroup.value.`);
  }
  if (reorderGroup && (onReorder || canReorder)) {
    throw new Error(
      `GridList "${name}" cannot use onReorder or canReorder inside GridListReorderGroup because the group owns its complete order.`,
    );
  }
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const typeaheadSearch = useTypeaheadSearch();
  const [activeKey, setActiveKey] = useState(selected);
  const [dragValue, setDragValue] = useState("");
  const [dragLabel, setDragLabel] = useState("");
  const [dropTarget, setDropTargetState] = useState<GridListDropTarget | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const activeKeyRef = useRef(activeKey);
  const handledFocusRequest = useRef<GridListFocusRequest | null>(null);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const gridListElementRef = useRef<HTMLDivElement | null>(null);
  const registeredList = useRef<{
    group: GridListReorderGroupContextValue;
    name: string;
    element: HTMLDivElement;
  } | null>(null);
  const registerListRef = (element: HTMLDivElement | null) => {
    if (!element) {
      const registered = registeredList.current;
      if (registered) registered.group.unregisterList(registered.name, registered.element);
      registeredList.current = null;
      return;
    }
    if (!reorderGroup || !name) return;
    reorderGroup.registerList(name, element);
    registeredList.current = { group: reorderGroup, name, element };
  };
  const composedRef = useComposedRefs(registerListRef, gridListElementRef, ref);

  useEffect(() => {
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const syncTabStops = (key: string) => {
    for (const item of itemMap.current.values()) {
      if (!item.element) continue;
      if (item.disabled) {
        item.element.removeAttribute("tabindex");
        continue;
      }
      item.element.tabIndex = item.key === key ? 0 : -1;
    }
  };

  const activateRow = (key: string) => {
    activeKeyRef.current = key;
    syncTabStops(key);
    setActiveKey(key);
  };

  const register = (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
    removedElement?: HTMLElement,
  ) => {
    if (!element) {
      const registered = itemMap.current.get(key);
      if (removedElement && registered?.element !== removedElement) return;
      itemMap.current.delete(key);
      if (reorderGroup && name && removedElement) {
        reorderGroup.unregisterRow(name, key, removedElement);
      }
      return;
    }
    const registered = itemMap.current.get(key);
    if (registered?.element && registered.element !== element) {
      throw new Error(`GridListItem value "${key}" is rendered more than once inside GridList.`);
    }
    itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
    if (reorderGroup && name) {
      reorderGroup.registerRow(name, key, textValue, element, Boolean(disabled));
    }
  };

  const items = () => sortItems([...itemMap.current.values()]);

  useLayoutEffect(() => {
    const element = gridListElementRef.current;
    const registered = registeredList.current;
    if (!reorderGroup || !name || !element) {
      if (registered) registered.group.unregisterList(registered.name, registered.element);
      registeredList.current = null;
      return;
    }
    if (registered && registered.name !== name) {
      registered.group.unregisterList(registered.name, registered.element);
      registeredList.current = null;
    }
    if (!registeredList.current) {
      reorderGroup.registerList(name, element);
      registeredList.current = { group: reorderGroup, name, element };
    }
  });

  useLayoutEffect(() => {
    const focusRequest = reorderGroup?.focusRequest;
    if (
      focusRequest &&
      focusRequest !== handledFocusRequest.current &&
      focusRequest.list === name
    ) {
      const movedItem = itemMap.current.get(focusRequest.value);
      if (movedItem?.element && !movedItem.disabled) {
        handledFocusRequest.current = focusRequest;
        activateRow(movedItem.key);
        movedItem.element.focus();
        reorderGroup.acknowledgeFocusRequest(focusRequest);
        return;
      }
    }
    const current = itemMap.current.get(activeKeyRef.current);
    if (current && !current.disabled) {
      syncTabStops(current.key);
      return;
    }
    const nextActiveKey = items().find((item) => !item.disabled)?.key ?? "";
    if (nextActiveKey !== activeKeyRef.current) activateRow(nextActiveKey);
  });

  const context: GridListContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey: activateRow,
    setSelectedKey: setSelected,
    register,
    items,
  };

  const focusRow = (key: string | undefined) => {
    if (!key) return false;
    const row = itemMap.current.get(key)?.element;
    if (!row) return false;
    activateRow(key);
    row.focus();
    return true;
  };

  const resetDrag = () => {
    setDragValue("");
    setDragLabel("");
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
        activateRow(movedValue);
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
    if (canReorder && !canReorder(order, movedValue)) {
      const label = itemMap.current.get(movedValue)?.textValue ?? movedValue;
      setAnnouncement(`Cannot move ${label} there.`);
      return;
    }
    onReorder(order);
    announceMove(movedValue, order);
    refocusAfterReorder(movedValue);
  };

  /** The order a drop on the given target would produce, or null when it changes nothing or is vetoed by canReorder. */
  const orderForDrop = (movedValue: string, target: GridListDropTarget) => {
    if (target.value === movedValue) return null;
    const current = items().map((item) => item.key);
    const order = current.filter((key) => key !== movedValue);
    const targetIndex = order.indexOf(target.value);
    if (targetIndex < 0) return null;
    order.splice(target.edge === "before" ? targetIndex : targetIndex + 1, 0, movedValue);
    if (order.every((key, index) => key === current[index])) return null;
    if (canReorder && !canReorder(order, movedValue)) return null;
    return order;
  };

  const setDropTarget = (target: GridListDropTarget | null) => {
    if (!target || !dragValue) {
      setDropTargetState(null);
      return;
    }
    setDropTargetState(orderForDrop(dragValue, target) ? target : null);
  };

  const commitDrop = () => {
    if (onReorder && dragValue && dropTarget) {
      const order = orderForDrop(dragValue, dropTarget);
      if (order) {
        onReorder(order);
        announceMove(dragValue, order);
      }
    }
    resetDrag();
  };

  let dndContext: GridListDndContextValue | null = null;
  if (reorderGroup && name) {
    let groupDropTarget: GridListDropTarget | null = null;
    if (reorderGroup.target?.list === name && reorderGroup.target.value !== null) {
      groupDropTarget = {
        value: reorderGroup.target.value,
        edge: reorderGroup.target.edge,
      };
    }
    dndContext = {
      listName: name,
      dragValue: reorderGroup.source?.value ?? "",
      dragLabel: reorderGroup.source?.label ?? "",
      hasDropTarget: Boolean(reorderGroup.target),
      previewIndex: () => undefined,
      dropTarget: groupDropTarget,
      listDropTarget: reorderGroup.target?.list === name,
      startDrag: (movedValue, label) => reorderGroup.startDrag(name, movedValue, label),
      setDropTarget: (target) => {
        if (!target) {
          reorderGroup.setDropTarget(null);
          return;
        }
        reorderGroup.setDropTarget({ list: name, ...target });
      },
      setDropAtEnd: () => reorderGroup.setDropTarget({ list: name, value: null, edge: "after" }),
      commitDrop: reorderGroup.commitDrop,
      endDrag: reorderGroup.endDrag,
      moveItem: (movedValue, delta) => reorderGroup.moveWithin(name, movedValue, delta),
    };
  } else if (onReorder) {
    const previewOrder = dragValue && dropTarget ? orderForDrop(dragValue, dropTarget) : null;
    dndContext = {
      dragValue,
      dragLabel,
      hasDropTarget: Boolean(dropTarget),
      previewIndex: (rowValue) => {
        const index = previewOrder?.indexOf(rowValue) ?? -1;
        return index < 0 ? undefined : index;
      },
      dropTarget,
      listDropTarget: Boolean(dropTarget),
      startDrag: (movedValue, label) => {
        setDragValue(movedValue);
        setDragLabel(label);
      },
      setDropTarget,
      setDropAtEnd: () => {
        const last = items().at(-1);
        setDropTarget(last ? { value: last.key, edge: "after" } : null);
      },
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
          ref={composedRef}
          role="grid"
          data-drop-target={dataAttr(dndContext?.listDropTarget)}
          onDragLeave={(event) => {
            onDragLeave?.(event);
            if (event.defaultPrevented || !dndContext) return;
            // Leaving the grid entirely clears the drop preview.
            const next = event.relatedTarget;
            if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
              dndContext.setDropTarget(null);
            }
          }}
          onDragOver={(event) => {
            onDragOver?.(event);
            if (event.defaultPrevented || !dndContext?.dragValue) return;
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
            dndContext.setDropAtEnd();
          }}
          onDrop={(event) => {
            onDrop?.(event);
            if (event.defaultPrevented || !dndContext?.dragValue) return;
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            dndContext.commitDrop();
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

            // Alt+Arrow also works from controls inside the row, such as a
            // drag handle.
            if (
              dndContext &&
              !rowRecord.disabled &&
              rowRecord.element.draggable &&
              event.altKey &&
              (event.key === "ArrowUp" || event.key === "ArrowDown")
            ) {
              event.preventDefault();
              dndContext.moveItem(rowRecord.key, event.key === "ArrowUp" ? -1 : 1);
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
              activateRow(rowRecord.key);
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
        </div>
        {/* Outside the grid element: role="grid" only permits row children. */}
        {onReorder && <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>}
      </GridListDndContext>
    </GridListContext>
  );
}
