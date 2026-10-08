import { type ComponentProps, type MouseEvent } from "react";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useNumberFieldContext } from "./number-field-shared.js";

export type NumberFieldIncrementProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function NumberFieldIncrement({
  as,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: NumberFieldIncrementProps) {
  const numberField = useNumberFieldContext("NumberFieldIncrement");
  const atMaximum =
    numberField.max !== undefined &&
    !Number.isNaN(numberField.value) &&
    numberField.value >= numberField.max;
  const resolvedDisabled = Boolean(disabled || numberField.disabled || atMaximum);
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Increase value";
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
      input.stepUp();
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
