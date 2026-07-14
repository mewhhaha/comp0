import { dataAttr, useComposedRefs } from "@comp0/core";
import { createElement, useLayoutEffect, type HTMLAttributes } from "react";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "./overlay-shared.js";

export type ComboboxPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

export function ComboboxPopover({
  offset,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: ComboboxPopoverProps & RefProp<HTMLDivElement>) {
  const combo = useComboBoxRootContext();
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const composedRef = useComposedRefs(surfaceRef, ref);
  if (!combo || !popover) throw new Error("ComboboxPopover must be rendered inside Combobox.");
  useLayoutEffect(() => {
    if (!popover.open) {
      combo.setActiveId("");
      combo.setActiveKey("");
    }
  }, [combo, popover.open]);
  // A consumer aria-label wins; falling back to the label id would point at
  // nothing when no Label is rendered.
  let labelledBy = props["aria-labelledby"];
  if (!props["aria-label"]) labelledBy = labelledBy ?? combo.labelId;
  const surface = createElement("div", {
    ...props,
    ref: composedRef,
    id: props.id ?? combo.listBoxId,
    role: props.role ?? "listbox",
    popover: "auto",
    hidden: !popover.open,
    style: placementSurfaceStyle(placement, offset, combo.inputId, style),
    "data-open": dataAttr(popover.open),
    "aria-labelledby": labelledBy,
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
  } as never);
  return surface;
}
