import { type ComponentProps, type MouseEvent } from "react";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { Button } from "../button/Button.js";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp } from "../internal/polymorphic.js";
import { useComboboxContext } from "./combobox-shared.js";

export type ComboboxTriggerProps = ComponentProps<"button"> & AsProp;

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
  const trigger = useDisclosureTrigger({
    as,
    open: popover.open,
    onOpenChange: popover.setOpen,
    controls: combobox.listBoxId,
    haspopup: "listbox",
    props: {
      ...props,
      disabled: resolvedDisabled,
      onClick(event: MouseEvent<HTMLButtonElement>) {
        onClick?.(event);
        if (event.defaultPrevented || popover.open) return;
        event.currentTarget.ownerDocument.getElementById(combobox.inputId)?.focus();
      },
    },
  });

  return (
    <Button
      {...props}
      as={as}
      aria-describedby={description || undefined}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-label={ariaLabel}
      {...trigger}
    />
  );
}
