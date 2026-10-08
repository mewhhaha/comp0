import { createElement, type ComponentProps, type ElementType, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { Button } from "../button/Button.js";
import { useColorPickerContext } from "./color-picker-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "../internal/overlay/index.js";

export type ColorPickerTriggerProps = ComponentProps<"button"> & AsProp;

export function ColorPickerTrigger({
  as,
  disabled,
  onClick,
  ref,
  style,
  ...props
}: ColorPickerTriggerProps) {
  const colorPicker = useColorPickerContext("ColorPickerTrigger");
  // ColorPicker provides the popover context together with its own, which the required read above guarantees.
  const popover = usePopoverContext()!;
  const field = useFieldContext();
  const resolvedDisabled = Boolean(disabled || colorPicker.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  const composedRef = useComposedRefs(ref, popover.setTriggerElement);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Choose color";
  }

  return createElement(Button as ElementType, {
    ...props,
    as,
    ref: composedRef,
    disabled: resolvedDisabled,
    id: props.id ?? popover.triggerId,
    style: triggerAnchorStyle(popover.triggerId, style),
    "aria-controls": props["aria-controls"] ?? popover.contentId,
    "aria-describedby": description || undefined,
    "aria-expanded": popover.open,
    "aria-haspopup": props["aria-haspopup"] ?? "dialog",
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    "aria-label": ariaLabel,
    "data-slot": dataSlot(props, "color-picker-trigger"),
    "data-open": dataAttr(popover.open),
    "data-value": colorPicker.value,
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
  });
}
