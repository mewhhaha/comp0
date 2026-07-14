import { createElement, Fragment } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import {
  triggerAnchorStyle,
  usePopoverContext,
  type OverlayTriggerProps,
} from "./overlay-shared.js";
export type PopoverTriggerProps = OverlayTriggerProps;

export function PopoverTrigger({
  as,
  onClick,
  ref,
  style,
  ...props
}: PopoverTriggerProps & RefProp<HTMLButtonElement>) {
  const popover = usePopoverContext();
  const triggerRef = useComposedRefs(ref, popover?.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";
  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? popover?.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    style: triggerAnchorStyle(popover?.triggerId, style),
    "aria-controls": props["aria-controls"] ?? popover?.contentId,
    "aria-expanded": popover?.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "data-open": dataAttr(popover?.open),
    "data-slot": dataSlot(props, "popover-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) popover?.setOpen(!popover.open);
    },
  });
}
