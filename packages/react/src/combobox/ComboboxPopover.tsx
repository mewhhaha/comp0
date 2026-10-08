import { useLayoutEffect, type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";
import { useRenderedId } from "../internal/rendered-id.js";
import { useComboboxContext } from "./combobox-shared.js";

export type ComboboxPopoverProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function ComboboxPopover({
  as,
  offset,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: ComboboxPopoverProps) {
  const combo = useComboboxContext("ComboboxPopover");
  const { popover, setActiveKey } = combo;
  const surface = useOverlaySurface<HTMLDivElement>({
    id: props.id ?? combo.listBoxId,
    offset,
    onToggle,
    placement,
    popover: "auto",
    ref,
    style,
  });
  useLayoutEffect(() => {
    if (!popover.open) setActiveKey("");
  }, [popover.open, setActiveKey]);
  // Reference the label only when one is rendered; otherwise the input names the list.
  const label = useRenderedId(surface.surfaceRef, combo.labelId, combo);
  let labelledBy = props["aria-labelledby"];
  if (!props["aria-label"]) labelledBy = labelledBy ?? label ?? combo.inputId;

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      role={props.role ?? "listbox"}
      aria-labelledby={labelledBy}
    />
  );
}
