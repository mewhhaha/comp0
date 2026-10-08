import { type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  useOptionalGridListDndContext,
  useOptionalGridListItemContext,
} from "./grid-list-shared.js";

const keyboardMoveDirections = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
} as const;

export type GridListDragHandleProps = ComponentProps<"button"> & AsProp;

/** Optional labelled drag affordance and keyboard reorder control inside a GridListItem. */
export function GridListDragHandle({
  as,
  onBlur,
  onClick,
  onKeyDown,
  ...props
}: GridListDragHandleProps) {
  const item = useOptionalGridListItemContext();
  const dnd = useOptionalGridListDndContext();
  if (!dnd || !item?.reorderable) return null;
  const moving = dnd.dragValue === item.value;

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={as === undefined || as === "button" ? "button" : undefined}
      draggable={true}
      aria-label={props["aria-label"] ?? `Reorder ${item.label}`}
      aria-keyshortcuts={props["aria-keyshortcuts"] ?? "Alt+ArrowUp Alt+ArrowDown"}
      data-dragging={dataAttr(moving)}
      data-slot="grid-list-drag-handle"
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          if (moving) dnd.commitKeyboardMove();
          else dnd.beginKeyboardMove(item.value);
          return;
        }
        if (!moving) return;
        const direction = keyboardMoveDirections[event.key as keyof typeof keyboardMoveDirections];
        if (direction) {
          event.preventDefault();
          event.stopPropagation();
          dnd.retargetKeyboardMove(direction);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          dnd.cancelKeyboardMove();
        }
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        // Assistive technology can activate the button with a synthesized
        // click that never produces key events.
        if (event.detail !== 0) return;
        if (moving) dnd.commitKeyboardMove();
        else dnd.beginKeyboardMove(item.value);
      }}
      onBlur={(event: FocusEvent<HTMLButtonElement>) => {
        onBlur?.(event);
        if (moving) dnd.cancelKeyboardMove();
      }}
    />
  );
}
