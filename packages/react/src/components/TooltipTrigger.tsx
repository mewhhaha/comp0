import { createElement, Fragment } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import {
  triggerAnchorStyle,
  useTooltipContext,
  type OverlayTriggerProps,
} from "./overlay-shared.js";
export type TooltipTriggerProps = OverlayTriggerProps;

export function TooltipTrigger({
  as,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: TooltipTriggerProps & RefProp<HTMLButtonElement>) {
  const tooltip = useTooltipContext();
  const triggerRef = useComposedRefs(ref, tooltip?.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";
  let ariaDescribedBy = props["aria-describedby"];
  if (tooltip?.open) ariaDescribedBy = ariaDescribedBy ?? tooltip.contentId;
  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? tooltip?.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    // Focus must reach non-native triggers or the tooltip never opens for
    // keyboard users. Fragment triggers keep their own element's focusability.
    tabIndex: isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0),
    style: triggerAnchorStyle(tooltip?.triggerId, style),
    "aria-describedby": ariaDescribedBy,
    "data-open": dataAttr(tooltip?.open),
    "data-slot": dataSlot(props, "tooltip-trigger"),
    onFocus(event: React.FocusEvent<HTMLButtonElement>) {
      onFocus?.(event);
      if (!event.defaultPrevented) tooltip?.setOpen(true);
    },
    onBlur(event: React.FocusEvent<HTMLButtonElement>) {
      onBlur?.(event);
      if (!event.defaultPrevented) tooltip?.setOpen(false);
    },
    onPointerEnter(event: React.PointerEvent<HTMLButtonElement>) {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) tooltip?.setOpen(true);
    },
    onPointerLeave(event: React.PointerEvent<HTMLButtonElement>) {
      onPointerLeave?.(event);
      // Delayed so the pointer can travel onto the tooltip content.
      if (!event.defaultPrevented) tooltip?.scheduleClose();
    },
  });
}
