import { createElement, Fragment } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { useDialogContext, type OverlayTriggerProps } from "./overlay-shared.js";
export type DialogTriggerProps = OverlayTriggerProps;

export function DialogTrigger({
  as,
  onClick,
  ref,
  ...props
}: DialogTriggerProps & RefProp<HTMLButtonElement>) {
  const dialog = useDialogContext();
  const triggerRef = (element: HTMLButtonElement | null) => {
    dialog?.setTriggerElement(element);
    composeRefs(ref)(element);
  };
  const Trigger = as === Fragment ? Slot : (as ?? "button");

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? dialog?.triggerId,
    type: as ? undefined : (props.type ?? "button"),
    "aria-controls": props["aria-controls"] ?? dialog?.contentId,
    "aria-expanded": dialog?.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "data-open": dataAttr(dialog?.open),
    "data-slot": dataSlot(props, "dialog-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) dialog?.setOpen(!dialog.open);
    },
  });
}
