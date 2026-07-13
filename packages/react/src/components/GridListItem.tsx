import { useContext, useId, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { resolveItemLabel } from "./collection-shared.js";
import {
  GridListContext,
  GridListDndContext,
  GridListItemContext,
  rowFocusables,
  type GridListContextValue,
  type GridListItemContextValue,
} from "./grid-list-shared.js";

export type GridListItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** Overrides the text crawled from children for typeahead. */
  textValue?: string | undefined;
};

export function GridListItem({
  id: idProp,
  value: valueProp,
  disabled,
  textValue,
  children,
  onClick,
  onFocus,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  ref,
  ...props
}: GridListItemProps & RefProp<HTMLDivElement>) {
  const gridList = useContext(GridListContext);
  const dnd = useContext(GridListDndContext);
  const generatedId = useId().replace(/:/g, "");
  const value = valueProp ?? generatedId;
  const id = idProp ?? `grid-list-row-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const reorderable = Boolean(dnd) && !resolvedDisabled;
  const ariaLabel = props["aria-label"];
  const [crawledLabel, setCrawledLabel] = useState("");
  let label = textValue;
  if (label === undefined && typeof children === "string") label = children;
  if (label === undefined && crawledLabel) label = crawledLabel;
  if (label === undefined) label = ariaLabel ?? value;
  // A mounted GridListDragHandle takes over drag initiation so the row body
  // stays free for scrolling and text selection.
  const handleCount = useRef(0);
  const [hasHandle, setHasHandle] = useState(false);
  const registerHandle = () => {
    handleCount.current += 1;
    if (handleCount.current === 1) setHasHandle(true);
    return () => {
      handleCount.current -= 1;
      if (handleCount.current === 0) setHasHandle(false);
    };
  };
  const itemContext: GridListItemContextValue = {
    value,
    label,
    listName: dnd?.listName,
    reorderable,
    registerHandle,
  };
  const selected = gridList?.selectedKey === value;
  const active = gridList?.activeKey === value;
  const dragging = dnd?.dragValue === value;
  const dropEdge = dnd?.dropTarget?.value === value ? dnd.dropTarget.edge : undefined;
  const rowRef = useRef<HTMLDivElement | null>(null);
  const registeredRow = useRef<{
    gridList: GridListContextValue;
    value: string;
    label: string;
    disabled: boolean;
    element: HTMLDivElement;
  } | null>(null);
  const registerRowRef = (element: HTMLDivElement | null) => {
    if (!element) {
      const registered = registeredRow.current;
      registered?.gridList.register(
        registered.value,
        registered.label,
        null,
        registered.disabled,
        registered.element,
      );
      registeredRow.current = null;
      return;
    }
    if (!gridList) return;
    gridList.register(value, label, element, resolvedDisabled);
    registeredRow.current = {
      gridList,
      value,
      label,
      disabled: resolvedDisabled,
      element,
    };
  };
  const composedRef = useComposedRefs(registerRowRef, rowRef, ref);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  // Interactive children are reachable with ArrowRight instead of Tab, so
  // the grid stays a single tab stop.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    for (const element of rowFocusables(row)) element.tabIndex = -1;
    // Re-register after every render so crawled labels follow content changes.
    const resolvedLabel = resolveItemLabel({
      textValue,
      children,
      element: row,
      ariaLabel,
      fallback: value,
    });
    if (resolvedLabel !== label) setCrawledLabel(resolvedLabel);
    const registered = registeredRow.current;
    if (registered && registered.value !== value) {
      registered.gridList.register(
        registered.value,
        registered.label,
        null,
        registered.disabled,
        registered.element,
      );
    }
    gridList?.register(value, resolvedLabel, row, resolvedDisabled);
    if (gridList) {
      registeredRow.current = {
        gridList,
        value,
        label: resolvedLabel,
        disabled: resolvedDisabled,
        element: row,
      };
    }
  }, [ariaLabel, children, gridList, label, resolvedDisabled, textValue, value]);

  return (
    <div
      {...props}
      ref={composedRef}
      id={id}
      role="row"
      tabIndex={tabIndex}
      draggable={(reorderable && !hasHandle) || undefined}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      aria-keyshortcuts={reorderable ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-dragging={dataAttr(dragging)}
      data-drop-before={dataAttr(dropEdge === "before")}
      data-drop-after={dataAttr(dropEdge === "after")}
      data-value={value}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) gridList?.setActiveKey(value);
      }}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) return;
        // Clicking an interactive child performs its action without
        // changing the selection.
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target && rowFocusables(event.currentTarget).some((el) => el.contains(target))) return;
        gridList?.setActiveKey(value);
        gridList?.setSelectedKey(value);
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
        if (event.defaultPrevented || !reorderable || !dnd) return;
        const eventTarget = event.target instanceof Element ? event.target : null;
        const dragHandle = eventTarget?.closest("[data-slot='grid-list-drag-handle']");
        const startsFromHandle = dragHandle?.closest("[role='row']") === event.currentTarget;
        if (hasHandle ? !startsFromHandle : event.target !== event.currentTarget) return;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", label);
        }
        dnd.startDrag(value, label);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented || !dnd?.dragValue) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        if (dnd.dragValue === value) {
          dnd.setDropTarget(null);
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const edge = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
        dnd.setDropTarget({ value, edge });
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (event.defaultPrevented || !dnd?.dragValue) return;
        event.preventDefault();
        dnd.commitDrop();
      }}
      onDragEnd={(event) => {
        onDragEnd?.(event);
        // Fires on the source row after both drops and cancelled drags.
        dnd?.endDrag();
      }}
    >
      <GridListItemContext value={itemContext}>
        <div role="gridcell" data-slot="grid-list-cell">
          {children}
        </div>
      </GridListItemContext>
    </div>
  );
}
