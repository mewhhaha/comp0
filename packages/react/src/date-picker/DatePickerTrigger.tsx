import { createElement, type ComponentProps, type ElementType, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { Button } from "../button/Button.js";
import { useDatePickerContext } from "../internal/date-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "../internal/overlay/index.js";

export type DatePickerTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

/** Opens the calendar popover. The default aria-label is the English "Choose date"; pass your own translation. */
export function DatePickerTrigger({
  as,
  disabled,
  onClick,
  ref,
  style,
  ...props
}: DatePickerTriggerProps) {
  const picker = useDatePickerContext("DatePickerTrigger");
  // DatePicker provides the popover context together with its own, which the required read above guarantees.
  const popover = usePopoverContext()!;
  const field = useFieldContext();
  const resolvedDisabled = Boolean(disabled || picker.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  const composedRef = useComposedRefs(ref, popover.setTriggerElement);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Choose date";
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
    "data-slot": dataSlot(props, "date-picker-trigger"),
    "data-open": dataAttr(popover.open),
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
  });
}
