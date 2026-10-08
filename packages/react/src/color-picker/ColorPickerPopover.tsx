import { type ComponentProps, type KeyboardEvent } from "react";
import { useColorPickerContext } from "./color-picker-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";

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
  const surface = useOverlaySurface<HTMLDivElement>({
    popover: "auto",
    id: props.id,
    offset,
    onToggle,
    placement,
    ref,
    style,
    // The saturation input is the first stop of the color area.
    initialFocus: [
      "[data-color-area-input='saturation']",
      "input:not(:disabled), button:not(:disabled)",
    ],
  });
  // ColorPicker provides the popover context together with its own, which the required read guarantees.
  const popover = surface.popover!;
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Color picker";
  }

  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="color-picker-popover"
      {...props}
      {...surface.props}
      role={props.role ?? "dialog"}
      aria-label={ariaLabel}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        popover.requestClose();
      }}
    />
  );
}
