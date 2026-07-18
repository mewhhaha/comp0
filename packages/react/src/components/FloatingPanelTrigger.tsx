import { createElement, Fragment } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";
import { triggerAnchorStyle, type OverlayTriggerProps } from "./overlay-shared.js";

export type FloatingPanelTriggerProps = OverlayTriggerProps;

export function FloatingPanelTrigger({
  as,
  onClick,
  ref,
  style,
  ...props
}: FloatingPanelTriggerProps & RefProp<HTMLButtonElement>) {
  const panel = useFloatingPanelContext("FloatingPanelTrigger");
  const triggerRef = useComposedRefs(ref, panel.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? panel.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    style: triggerAnchorStyle(panel.triggerId, style),
    "aria-controls": props["aria-controls"] ?? panel.contentId,
    "aria-expanded": panel.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "data-open": dataAttr(panel.open),
    "data-slot": dataSlot(props, "floating-panel-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      panel.setOpen(!panel.open);
      if (!panel.open) panel.activate();
    },
  });
}
