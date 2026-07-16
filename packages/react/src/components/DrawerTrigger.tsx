import { createElement, Fragment } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { useDrawerContext } from "./drawer-shared.js";
import type { OverlayTriggerProps } from "./overlay-shared.js";

export type DrawerTriggerProps = OverlayTriggerProps;

export function DrawerTrigger({
  as,
  onClick,
  ref,
  ...props
}: DrawerTriggerProps & RefProp<HTMLButtonElement>) {
  const drawer = useDrawerContext();
  const triggerRef = useComposedRefs(ref, drawer?.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? drawer?.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    "aria-controls": props["aria-controls"] ?? drawer?.contentId,
    "aria-expanded": drawer?.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "data-open": dataAttr(drawer?.open),
    "data-slot": dataSlot(props, "drawer-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) drawer?.setOpen(!drawer.open);
    },
  });
}
