import { createElement } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { usePopoverSurface, type PopoverContentProps } from "./overlay-shared.js";
export type { PopoverContentProps } from "./overlay-shared.js";

export function PopoverContent({
  as,
  hidden,
  onKeyDown,
  onToggle,
  popover: popoverProp = "auto",
  ref,
  ...props
}: PopoverContentProps & RefProp<HTMLDivElement>) {
  // Top layer by default, matching SelectPopover; pass popover="none" to
  // render in normal flow instead.
  const popoverMode = popoverProp === "none" ? undefined : popoverProp;
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>(popoverMode);
  const Content = as ?? "div";

  return createElement(Content, {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? popover?.contentId,
    role: props.role ?? "dialog",
    popover: popoverMode,
    anchor: props.anchor ?? popover?.triggerId,
    hidden: hidden ?? !popover?.open,
    "data-open": dataAttr(popover?.open),
    "data-slot": dataSlot(props, "popover-content"),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      if (event.target !== event.currentTarget) return;
      if (event.defaultPrevented) return;
      onNativeToggle(event.newState === "open");
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape") return;
      event.preventDefault();
      popover?.requestClose();
    },
  });
}
