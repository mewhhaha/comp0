import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type MouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { Button } from "./Button.js";
import { useDateRangePickerContext } from "./date-range-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "./overlay-shared.js";

export type DateRangePickerTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target"> & {
    as?: ElementType | undefined;
  };

/** Opens the range calendar popover. The default aria-label is the English "Choose dates"; pass your own translation. */
export function DateRangePickerTrigger({
  as,
  disabled,
  onClick,
  ref,
  style,
  ...props
}: DateRangePickerTriggerProps & RefProp<HTMLButtonElement>) {
  const picker = useDateRangePickerContext("DateRangePickerTrigger")!;
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!popover) throw new Error("DateRangePickerTrigger must be rendered inside DateRangePicker.");
  const resolvedDisabled = Boolean(disabled || picker.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  const composedRef = useComposedRefs(ref, popover.setTriggerElement);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Choose dates";
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
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
  });
}
