import { type ComponentProps } from "react";
import { useInventoryContext, useInventoryItemContext } from "./inventory-shared.js";
import { type InventoryInteraction } from "./inventory-layout.js";

type HandleEventProps = Pick<
  ComponentProps<"button">,
  | "disabled"
  | "onBlur"
  | "onClick"
  | "onKeyDown"
  | "onPointerCancel"
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
>;

/**
 * Wires a move or resize handle button to the inventory's keyboard and pointer
 * gestures. Returns whether this handle's gesture is active, the item label,
 * and the event props to spread on the button.
 */
export function useInventoryHandle(
  part: string,
  kind: InventoryInteraction,
  {
    disabled,
    onBlur,
    onClick,
    onKeyDown,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }: HandleEventProps,
) {
  const inventory = useInventoryContext(part);
  const item = useInventoryItemContext(part);
  const { keyboard, pointer } = inventory;
  const active = inventory.activeValue === item.value && inventory.interaction === kind;

  const toggle = () => {
    if (active) keyboard.commit(item.value);
    else keyboard.begin(item.value, item.label, kind);
  };

  const eventProps: ComponentProps<"button"> = {
    disabled,
    onBlur: (event) => {
      onBlur?.(event);
      if (!event.defaultPrevented && active) keyboard.cancel(item.value);
    },
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.key === "Escape" && active) {
        event.preventDefault();
        keyboard.cancel(item.value);
        return;
      }
      keyboard.handleKey(event, item.value, kind);
    },
    onClick: (event) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled || event.detail !== 0) return;
      toggle();
    },
    onPointerDown: (event) => {
      onPointerDown?.(event);
      if (!event.defaultPrevented && !disabled) {
        pointer.start(event, item.value, item.label, kind);
      }
    },
    onPointerMove: (event) => {
      onPointerMove?.(event);
      if (!event.defaultPrevented) pointer.move(event);
    },
    onPointerUp: (event) => {
      onPointerUp?.(event);
      if (!event.defaultPrevented) pointer.finish(event);
    },
    onPointerCancel: (event) => {
      onPointerCancel?.(event);
      pointer.cancel(event);
    },
  };

  return { active, label: item.label, eventProps };
}
