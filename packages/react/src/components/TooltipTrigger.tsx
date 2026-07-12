import { createElement, Fragment, useCallback } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { useTooltipContext, type OverlayTriggerProps } from "./overlay-shared.js";
export type TooltipTriggerProps = OverlayTriggerProps;

export function TooltipTrigger({
  as,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: TooltipTriggerProps & RefProp<HTMLButtonElement>) {
  const tooltip = useTooltipContext();
  const triggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      tooltip?.setTriggerElement(element);
      composeRefs(ref)(element);
    },
    [tooltip, ref],
  );
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  let ariaDescribedBy = props["aria-describedby"];
  if (tooltip?.open) ariaDescribedBy ??= tooltip.contentId;
  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? tooltip?.triggerId,
    type: as ? undefined : (props.type ?? "button"),
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
