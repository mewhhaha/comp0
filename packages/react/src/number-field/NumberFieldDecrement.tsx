import { type ComponentProps, type MouseEvent } from "react";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useNumberFieldContext } from "./number-field-shared.js";

export type NumberFieldDecrementProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function NumberFieldDecrement({
  as,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: NumberFieldDecrementProps) {
  const numberField = useNumberFieldContext("NumberFieldDecrement");
  const atMinimum =
    numberField.min !== undefined &&
    !Number.isNaN(numberField.value) &&
    numberField.value <= numberField.min;
  const resolvedDisabled = Boolean(disabled || numberField.disabled || atMinimum);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Decrease value";
  }

  const isNativeButton = as === undefined || as === "button";
  const disabledAttributes = disabledProps<HTMLButtonElement>(resolvedDisabled, {
    native: isNativeButton,
    onKeyDown,
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const input = numberField.inputRef.current;
      if (!input) return;
      input.stepDown();
      input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      numberField.announceValue(input.getAttribute("aria-valuetext") ?? input.value);
    },
  });

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? "button" : undefined}
      tabIndex={props.tabIndex ?? -1}
      aria-controls={props["aria-controls"] ?? numberField.controlId}
      aria-label={ariaLabel}
      {...disabledAttributes}
    />
  );
}
