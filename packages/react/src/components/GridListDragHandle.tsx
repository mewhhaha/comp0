import { useContext, type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  GridListDndContext,
  GridListItemContext,
  GridListReorderGroupContext,
} from "./grid-list-shared.js";

export type GridListDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

const keyboardMoveDirections = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
} as const;

/** Optional labelled drag affordance and keyboard reorder control inside a GridListItem. */
export function GridListDragHandle({
  onBlur,
  onClick,
  onKeyDown,
  ref,
  ...props
}: GridListDragHandleProps & RefProp<HTMLButtonElement>) {
  const item = useContext(GridListItemContext);
  const dnd = useContext(GridListDndContext);
  const group = useContext(GridListReorderGroupContext);
  if (!dnd || !item?.reorderable) return null;
  const list = item.listName;
  const moving = dnd.dragValue === item.value;

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      draggable
      aria-label={props["aria-label"] ?? `Reorder ${item.label}`}
      aria-keyshortcuts={props["aria-keyshortcuts"] ?? "Alt+ArrowUp Alt+ArrowDown"}
      data-dragging={dataAttr(moving)}
      data-slot="grid-list-drag-handle"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !group || !list) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          if (moving) group.commitKeyboardMove();
          else group.beginKeyboardMove(list, item.value);
          return;
        }
        if (!moving) return;
        const direction = keyboardMoveDirections[event.key as keyof typeof keyboardMoveDirections];
        if (direction) {
          event.preventDefault();
          event.stopPropagation();
          group.retargetKeyboardMove(direction);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          group.cancelKeyboardMove();
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !group || !list) return;
        // Assistive technology can activate the button with a synthesized
        // click that never produces key events.
        if (event.detail !== 0) return;
        if (moving) group.commitKeyboardMove();
        else group.beginKeyboardMove(list, item.value);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (moving && group) group.cancelKeyboardMove();
      }}
    />
  );
}
