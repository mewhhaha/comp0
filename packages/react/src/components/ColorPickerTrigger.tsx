import { createElement, type ButtonHTMLAttributes, type ElementType, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { Button } from "./Button.js";
import { useColorPickerContext } from "./color-picker-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "./overlay-shared.js";

export type ColorPickerTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: ElementType | undefined;
};

export function ColorPickerTrigger({
  as,
  disabled,
  onClick,
  ref,
  style,
  ...props
}: ColorPickerTriggerProps & RefProp<HTMLButtonElement>) {
  const colorPicker = useColorPickerContext("ColorPickerTrigger");
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!popover) throw new Error("ColorPickerTrigger must be rendered inside ColorPicker.");
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
    "data-open": dataAttr(popover.open),
    "data-value": colorPicker.value,
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
  });
}
