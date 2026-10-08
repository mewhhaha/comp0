import { type ComponentProps, type DragEvent, type KeyboardEvent } from "react";
import { dataAttr, useComposedRefs, useControllableState } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";
import { groupDndContext, groupDropPreviewLabel } from "./grid-list-group-dnd.js";
import {
  GridListDndContext,
  GridListContext,
  useOptionalGridListReorderGroupContext,
} from "./grid-list-shared.js";
import { useGridListKeyboard } from "./useGridListKeyboard.js";
import { useGridListMembership } from "./useGridListMembership.js";
import { useGridListReorder } from "./useGridListReorder.js";
import { useGridListRows } from "./useGridListRows.js";

export type GridListProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
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
  as,
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
}: GridListProps) {
  const reorderGroup = useOptionalGridListReorderGroupContext();
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
  const { collection, context, activateRow, focusRow, refocusAfterReorder } = useGridListRows({
    selected,
    select: setSelected,
    name,
    group: reorderGroup,
  });
  const listRef = useGridListMembership(name, reorderGroup);
  const composedRef = useComposedRefs(listRef, ref);
  const local = useGridListReorder({ collection, onReorder, canReorder, refocusAfterReorder });

  let dnd = local.dnd;
  let dropPreviewLabel = local.dropPreviewLabel;
  if (reorderGroup && name) {
    dnd = groupDndContext(reorderGroup, name);
    dropPreviewLabel = groupDropPreviewLabel(reorderGroup, name);
  }
  const handleKeyDown = useGridListKeyboard({
    collection,
    dnd,
    focusRow,
    activateRow,
    select: setSelected,
  });

  const Part = partElement(as, "div");
  return (
    <GridListContext value={context}>
      <GridListDndContext value={dnd}>
        <Part
          {...props}
          ref={composedRef}
          role="grid"
          data-drop-target={dataAttr(dnd?.listDropTarget)}
          data-drop-preview={dropPreviewLabel || undefined}
          onDragLeave={(event: DragEvent<HTMLDivElement>) => {
            onDragLeave?.(event);
            if (event.defaultPrevented || !dnd) return;
            // Leaving the grid entirely clears the drop preview.
            const next = event.relatedTarget;
            const ownerWindow = event.currentTarget.ownerDocument.defaultView;
            if (
              !ownerWindow ||
              !(next instanceof ownerWindow.Node) ||
              !event.currentTarget.contains(next)
            ) {
              dnd.setDropTarget(null);
            }
          }}
          onDragOver={(event: DragEvent<HTMLDivElement>) => {
            onDragOver?.(event);
            if (event.defaultPrevented || !dnd?.dragValue) return;
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
            dnd.setDropAtEnd();
          }}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            onDrop?.(event);
            if (event.defaultPrevented || !dnd?.dragValue) return;
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            dnd.commitDrop();
          }}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            onKeyDown?.(event);
            if (!event.defaultPrevented) handleKeyDown(event);
          }}
        >
          {children}
        </Part>
        {/* Outside the grid element: role="grid" only permits row children. */}
        {onReorder && <VisuallyHidden aria-live="polite">{local.announcement}</VisuallyHidden>}
      </GridListDndContext>
    </GridListContext>
  );
}
