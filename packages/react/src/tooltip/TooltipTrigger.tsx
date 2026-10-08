import { Fragment, type ComponentProps, type FocusEvent, type PointerEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { triggerAnchorStyle, useRequiredTooltipContext } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TooltipTriggerProps = ComponentProps<"button"> & AsProp;

export function TooltipTrigger({
  as,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: TooltipTriggerProps) {
  const tooltip = useRequiredTooltipContext("TooltipTrigger");
  const triggerRef = useComposedRefs(ref, tooltip.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";
  let ariaDescribedBy = props["aria-describedby"];
  if (tooltip.open) ariaDescribedBy = ariaDescribedBy ?? tooltip.contentId;
  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="tooltip-trigger"
      {...props}
      ref={triggerRef}
      id={props.id ?? tooltip.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      // Focus must reach non-native triggers or the tooltip never opens for
      // keyboard users. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      style={triggerAnchorStyle(tooltip.triggerId, style)}
      aria-describedby={ariaDescribedBy}
      data-open={dataAttr(tooltip.open)}
      onFocus={(event: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented) tooltip.setOpen(true);
      }}
      onBlur={(event: FocusEvent<HTMLButtonElement>) => {
        onBlur?.(event);
        if (!event.defaultPrevented) tooltip.setOpen(false);
      }}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) tooltip.setOpen(true);
      }}
      onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event);
        // Delayed so the pointer can travel onto the tooltip content.
        if (!event.defaultPrevented) tooltip.scheduleClose();
      }}
    />
  );
}
