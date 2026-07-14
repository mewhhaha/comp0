import { useContext, type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { GridListDndContext, GridListItemContext } from "./grid-list-shared.js";

export type GridListDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Optional labelled drag affordance and keyboard reorder control inside a GridListItem. */
export function GridListDragHandle({
  ref,
  ...props
}: GridListDragHandleProps & RefProp<HTMLButtonElement>) {
  const item = useContext(GridListItemContext);
  const dnd = useContext(GridListDndContext);
  if (!dnd || !item?.reorderable) return null;

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      draggable
      aria-label={props["aria-label"] ?? `Reorder ${item.label}`}
      aria-keyshortcuts={props["aria-keyshortcuts"] ?? "Alt+ArrowUp Alt+ArrowDown"}
      data-dragging={dataAttr(dnd.dragValue === item.value)}
      data-slot="grid-list-drag-handle"
    />
  );
}
