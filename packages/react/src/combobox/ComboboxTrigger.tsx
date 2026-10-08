import { createElement, type ComponentProps, type ElementType, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { Button } from "../button/Button.js";
import { type AsProp } from "../internal/polymorphic.js";
import { useComboboxContext } from "./combobox-shared.js";

export type ComboboxTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

/** Opens the suggestion popover. The default aria-label is the English "Show suggestions"; pass your own translation. */
export function ComboboxTrigger({ as, disabled, onClick, ...props }: ComboboxTriggerProps) {
  const combobox = useComboboxContext("ComboboxTrigger");
  const { popover } = combobox;
  const field = useFieldContext();
  const resolvedDisabled = Boolean(disabled || combobox.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Show suggestions";
  }

  return createElement(Button as ElementType, {
    ...props,
    as,
    disabled: resolvedDisabled,
    "aria-controls": props["aria-controls"] ?? combobox.listBoxId,
    "aria-describedby": description || undefined,
    "aria-expanded": popover.open,
    "aria-haspopup": props["aria-haspopup"] ?? "listbox",
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    "aria-label": ariaLabel,
    "data-open": dataAttr(popover.open),
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const nextOpen = !popover.open;
      popover.setOpen(nextOpen);
      if (nextOpen) event.currentTarget.ownerDocument.getElementById(combobox.inputId)?.focus();
    },
  });
}
