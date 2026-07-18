import { createElement, Fragment } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { type OverlayTriggerProps } from "./overlay-shared.js";
import { useTourContext } from "./tour-shared.js";

export type TourTriggerProps = OverlayTriggerProps;

export function TourTrigger({
  as,
  onClick,
  ref,
  ...props
}: TourTriggerProps & RefProp<HTMLButtonElement>) {
  const tour = useTourContext();
  const triggerRef = useComposedRefs(ref, tour?.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    "aria-controls": props["aria-controls"] ?? tour?.contentId,
    "aria-expanded": tour?.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "data-open": dataAttr(tour?.open),
    "data-slot": dataSlot(props, "tour-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) tour?.start();
    },
  });
}
