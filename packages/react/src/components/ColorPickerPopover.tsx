import { createElement, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "./overlay-shared.js";

export type ColorPickerPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

export function ColorPickerPopover({
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: ColorPickerPopoverProps & RefProp<HTMLDivElement>) {
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const composedRef = useComposedRefs(surfaceRef, ref);
  if (!popover) throw new Error("ColorPickerPopover must be rendered inside ColorPicker.");
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (popover.open && !wasOpen.current) {
      const surface = surfaceRef.current;
      let target = surface?.querySelector<HTMLElement>("[data-color-area-input='saturation']");
      target =
        target ??
        surface?.querySelector<HTMLElement>("input:not(:disabled), button:not(:disabled)");
      target?.focus();
    }
    wasOpen.current = popover.open;
  }, [popover.open, surfaceRef]);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Color picker";
  }

  return createElement("div", {
    ...props,
    ref: composedRef,
    id: props.id ?? popover.contentId,
    role: props.role ?? "dialog",
    popover: "auto",
    hidden: !popover.open,
    style: placementSurfaceStyle(placement, offset, popover.triggerId, style),
    "aria-label": ariaLabel,
    "data-open": dataAttr(popover.open),
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      if (event.target !== event.currentTarget || event.defaultPrevented) return;
      onNativeToggle(event.newState === "open");
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== "Escape") return;
      event.preventDefault();
      popover.requestClose();
    },
  } as never);
}
