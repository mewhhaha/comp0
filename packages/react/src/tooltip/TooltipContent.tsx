import { type ComponentProps, type PointerEvent } from "react";
import {
  useOverlaySurface,
  useRequiredTooltipContext,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type TooltipContentProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function TooltipContent({
  as,
  hidden,
  offset,
  onPointerEnter,
  onPointerLeave,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: TooltipContentProps) {
  const tooltip = useRequiredTooltipContext("TooltipContent");
  // Manual mode keeps the tooltip in the top layer without light dismiss;
  // the trigger's hover and focus handlers own the open state.
  const surface = useOverlaySurface<HTMLDivElement>({
    popover: "manual",
    id: props.id,
    hidden,
    offset,
    onToggle,
    placement,
    ref,
    style,
  });
  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      role={props.role ?? "tooltip"}
      data-slot={dataSlot(props, "tooltip-content")}
      // Hovering the content keeps the tooltip open (WCAG 1.4.13).
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) tooltip.cancelClose();
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) tooltip.scheduleClose();
      }}
    />
  );
}
