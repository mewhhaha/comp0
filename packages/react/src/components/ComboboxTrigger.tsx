import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type MouseEvent,
} from "react";
import { dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { Button } from "./Button.js";
import { usePopoverContext } from "./overlay-shared.js";

export type ComboboxTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target"> & {
    as?: ElementType | undefined;
  };

/** Opens the suggestion popover. The default aria-label is the English "Show suggestions"; pass your own translation. */
export function ComboboxTrigger({
  as,
  disabled,
  onClick,
  ref,
  ...props
}: ComboboxTriggerProps & RefProp<HTMLButtonElement>) {
  const combobox = useComboBoxRootContext();
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!combobox || !popover) throw new Error("ComboboxTrigger must be rendered inside Combobox.");
  const resolvedDisabled = Boolean(disabled || combobox.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Show suggestions";
  }

  return createElement(Button as ElementType, {
    ...props,
    as,
    ref,
    disabled: resolvedDisabled,
    "aria-controls": props["aria-controls"] ?? combobox.listBoxId,
    "aria-describedby": description || undefined,
    "aria-expanded": popover.open,
    "aria-haspopup": props["aria-haspopup"] ?? "listbox",
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    "aria-label": ariaLabel,
    "data-open": dataAttr(popover.open),
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (event.defaultPrevented) return;
      const nextOpen = !popover.open;
      popover.setOpen(nextOpen);
      if (nextOpen) document.getElementById(combobox.inputId)?.focus();
    },
  });
}
