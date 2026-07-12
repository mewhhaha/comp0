import { useContext, useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { resolveItemLabel } from "./collection-shared.js";
import { GridListContext, GridListDndContext, rowFocusables } from "./grid-list-shared.js";

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
  const selected = gridList?.selectedKey === value;
  const active = gridList?.activeKey === value;
  const dragging = dnd?.dragValue === value;
  const dropEdge = dnd?.dropTarget?.value === value ? dnd.dropTarget.edge : undefined;
  const rowRef = useRef<HTMLDivElement | null>(null);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  const ariaLabel = props["aria-label"];

  const itemRef = (element: HTMLDivElement | null) => {
    rowRef.current = element;
    gridList?.register(
      value,
      resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
      element,
      resolvedDisabled,
    );
    composeRefs(ref)(element);
  };

  // Interactive children are reachable with ArrowRight instead of Tab, so
  // the grid stays a single tab stop.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    for (const element of rowFocusables(row)) element.tabIndex = -1;
    // Re-register after every render so crawled labels follow content changes.
    gridList?.register(
      value,
      resolveItemLabel({ textValue, children, element: row, ariaLabel, fallback: value }),
      row,
      resolvedDisabled,
    );
  });

  return (
    <div
      {...props}
      ref={itemRef}
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
      data-drop-before={dataAttr(dropEdge === "before")}
      data-drop-after={dataAttr(dropEdge === "after")}
      data-value={value}
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
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", textValue ?? value);
        }
        dnd.startDrag(value);
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
      <div role="gridcell" data-slot="grid-list-cell">
        {children}
      </div>
    </div>
  );
}
