import { useContext, useLayoutEffect, type ButtonHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { GridListDndContext, GridListItemContext } from "./grid-list-shared.js";

export type GridListDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Optional drag affordance inside a GridListItem. While one is mounted, drags
 * start from the handle instead of the whole row, keeping the row body free
 * for scrolling and text selection; Alt+Arrow moves keep working everywhere
 * in the row.
 */
export function GridListDragHandle({
  ref,
  ...props
}: GridListDragHandleProps & RefProp<HTMLButtonElement>) {
  const item = useContext(GridListItemContext);
  const dnd = useContext(GridListDndContext);
  useLayoutEffect(() => item?.registerHandle(), [item]);
  if (!dnd || !item?.reorderable) return null;

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      draggable
      aria-label={props["aria-label"] ?? `Reorder ${item.label}`}
      aria-keyshortcuts={props["aria-keyshortcuts"] ?? "Alt+ArrowUp Alt+ArrowDown"}
      data-slot="grid-list-drag-handle"
    />
  );
}
