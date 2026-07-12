import { createElement, Fragment } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { usePopoverContext, type OverlayTriggerProps } from "./overlay-shared.js";
export type PopoverTriggerProps = OverlayTriggerProps;

export function PopoverTrigger({
  as,
  onClick,
  ref,
  ...props
}: PopoverTriggerProps & RefProp<HTMLButtonElement>) {
  const popover = usePopoverContext();
  const triggerRef = (element: HTMLButtonElement | null) => {
    popover?.setTriggerElement(element);
    composeRefs(ref)(element);
  };
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? popover?.triggerId,
    type: as ? undefined : (props.type ?? "button"),
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
