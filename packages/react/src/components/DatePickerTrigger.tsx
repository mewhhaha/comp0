import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type MouseEvent,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { Button } from "./Button.js";
import { useDatePickerContext } from "./date-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "./overlay-shared.js";

export type DatePickerTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target"> & {
    as?: ElementType | undefined;
  };

/** Opens the calendar popover. The default aria-label is the English "Choose date"; pass your own translation. */
export function DatePickerTrigger({
  as,
  disabled,
  onClick,
  ref,
  style,
  ...props
}: DatePickerTriggerProps & RefProp<HTMLButtonElement>) {
  const picker = useDatePickerContext();
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!popover) throw new Error("DatePickerTrigger must be rendered inside Popover.");
  const resolvedDisabled = Boolean(disabled || picker?.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Choose date";
  }

  return createElement(Button as ElementType, {
    ...props,
    as,
    ref: composeRefs(ref, popover.setTriggerElement),
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
