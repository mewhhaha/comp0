import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { useColorPickerContext } from "./color-picker-shared.js";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";

export type ColorPickerPopoverProps = ComponentProps<"div"> & PopoverPlacementProps & AsProp;

export function ColorPickerPopover({
  as,
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: ColorPickerPopoverProps) {
  useColorPickerContext("ColorPickerPopover");
  const {
    onNativeToggle,
    popover: surfacePopover,
    surfaceRef,
  } = usePopoverSurface<HTMLDivElement>("auto");
  // ColorPicker provides the popover context together with its own, which the required read guarantees.
  const popover = surfacePopover!;
  const composedRef = useComposedRefs(surfaceRef, ref);
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

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={props.id ?? popover.contentId}
      role={props.role ?? "dialog"}
      popover="auto"
      hidden={!popover.open}
      style={placementSurfaceStyle(placement, offset, popover.triggerId, style)}
      aria-label={ariaLabel}
      data-slot={dataSlot(props, "color-picker-popover")}
      data-open={dataAttr(popover.open)}
      onToggle={(event: React.ToggleEvent<HTMLDivElement>) => {
        onToggle?.(event);
        if (event.target !== event.currentTarget || event.defaultPrevented) return;
        onNativeToggle(event.newState === "open");
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        popover.requestClose();
      }}
    />
  );
}
