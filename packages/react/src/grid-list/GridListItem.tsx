import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { resolveItemLabel } from "../internal/item-label.js";
import {
  GridListItemContext,
  rowCell,
  rowFocusables,
  useGridListContext,
  useOptionalGridListDndContext,
  type GridListItemContextValue,
} from "./grid-list-shared.js";

export type GridListItemProps = Omit<ComponentProps<"div">, "id"> &
  AsProp & {
    /** This row's selection key. */
    value: string;
    id?: string | undefined;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for typeahead. */
    textValue?: string | undefined;
  };

export function GridListItem({
  as,
  id: idProp,
  value,
  disabled,
  draggable,
  textValue,
  children,
  onClick,
  onFocus,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onPointerDownCapture,
  onPointerUpCapture,
  ref,
  ...props
}: GridListItemProps) {
  const gridList = useGridListContext("GridListItem");
  const dnd = useOptionalGridListDndContext();
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `grid-list-row-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const reorderable = Boolean(dnd) && !resolvedDisabled && draggable !== false;
  const ariaLabel = props["aria-label"];
  const [crawledLabel, setCrawledLabel] = useState("");
  let label = textValue;
  if (label === undefined && typeof children === "string") label = children;
  if (label === undefined && crawledLabel) label = crawledLabel;
  if (label === undefined) label = ariaLabel ?? value;
  const itemContext: GridListItemContextValue = {
    value,
    label,
    listName: dnd?.listName,
    reorderable,
  };
  const selected = gridList.selectedKey === value;
  const active = gridList.activeKey === value;
  const dragging = dnd?.dragValue === value;
  const dropEdge = dnd?.dropTarget?.value === value ? dnd.dropTarget.edge : undefined;
  const rowRef = useRef<HTMLElement | null>(null);
  const pointerStartedOnControl = useRef(false);
  const registerRow = (element: HTMLElement | null) => {
    if (!element) return;
    gridList.register({ key: value, id, textValue: label, element, disabled: resolvedDisabled });
    return () => gridList.unregister(value, element);
  };
  const composedRef = useComposedRefs(registerRow, rowRef, ref);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  // Interactive children use the inline-forward arrow instead of Tab, so the
  // grid stays a single tab stop.
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
    gridList.register({
      key: value,
      id,
      textValue: resolvedLabel,
      element: row,
      disabled: resolvedDisabled,
    });
  }, [ariaLabel, children, gridList, id, label, resolvedDisabled, textValue, value]);

  const Part = partElement(as, "div");
  return (
    <GridListItemContext value={itemContext}>
      <Part
        {...props}
        ref={composedRef}
        id={id}
        role="row"
        tabIndex={tabIndex}
        draggable={reorderable || undefined}
        aria-selected={selected}
        aria-disabled={resolvedDisabled || undefined}
        aria-keyshortcuts={reorderable ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
        data-selected={dataAttr(selected)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-dragging={dataAttr(dragging)}
        data-drag-previewing={dataAttr(dragging && dnd?.hasDropTarget)}
        data-drop-before={dataAttr(dropEdge === "before")}
        data-drop-after={dataAttr(dropEdge === "after")}
        data-drop-preview={dropEdge ? dnd?.dragLabel : undefined}
        data-value={value}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (!event.defaultPrevented && !resolvedDisabled) gridList.setActiveKey(value);
        }}
        onClick={(event: MouseEvent<HTMLDivElement>) => {
          if (resolvedDisabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (event.defaultPrevented) return;
          // Clicking an interactive child performs its action without
          // changing the selection.
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
          if (target && rowFocusables(event.currentTarget).some((el) => el.contains(target))) {
            return;
          }
          gridList.setActiveKey(value);
          gridList.setSelectedKey(value);
        }}
        onPointerDownCapture={(event: PointerEvent<HTMLDivElement>) => {
          onPointerDownCapture?.(event);
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const target =
            ownerWindow && event.target instanceof ownerWindow.Element ? event.target : null;
          const dragHandle = target?.closest("[data-slot='grid-list-drag-handle']");
          const startsFromHandle = dragHandle?.closest("[role='row']") === event.currentTarget;
          pointerStartedOnControl.current = Boolean(
            !startsFromHandle &&
            target &&
            rowFocusables(event.currentTarget).some((element) => element.contains(target)),
          );
        }}
        onPointerUpCapture={(event: PointerEvent<HTMLDivElement>) => {
          onPointerUpCapture?.(event);
          pointerStartedOnControl.current = false;
        }}
        onDragStart={(event: DragEvent<HTMLDivElement>) => {
          onDragStart?.(event);
          if (event.defaultPrevented || !reorderable || !dnd) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const eventTarget =
            ownerWindow && event.target instanceof ownerWindow.Element ? event.target : null;
          const dragHandle = eventTarget?.closest("[data-slot='grid-list-drag-handle']");
          const startsFromHandle = dragHandle?.closest("[role='row']") === event.currentTarget;
          const startsFromControl = rowFocusables(event.currentTarget).some((element) =>
            eventTarget ? element.contains(eventTarget) : false,
          );
          if (!startsFromHandle && startsFromControl) return;
          if (!startsFromHandle && pointerStartedOnControl.current) {
            event.preventDefault();
            pointerStartedOnControl.current = false;
            return;
          }
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", label);
          }
          dnd.startDrag(value, label);
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          onDragOver?.(event);
          if (event.defaultPrevented || !dnd?.dragValue) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          // A live preview relocates the source row under the pointer; keep the
          // pending target instead of flickering it away.
          if (dnd.dragValue === value) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const edge = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
          dnd.setDropTarget({ value, edge });
        }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          onDrop?.(event);
          if (event.defaultPrevented || !dnd?.dragValue) return;
          event.preventDefault();
          dnd.commitDrop();
        }}
        onDragEnd={(event: DragEvent<HTMLDivElement>) => {
          onDragEnd?.(event);
          pointerStartedOnControl.current = false;
          // Fires on the source row after both drops and cancelled drags.
          dnd?.endDrag();
        }}
      >
        {rowCell(as, children, "grid-list-cell")}
      </Part>
    </GridListItemContext>
  );
}
