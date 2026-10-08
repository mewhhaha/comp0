import { dataAttr } from "@comp0/core";
import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useNumberFieldContext } from "./number-field-shared.js";

export type NumberFieldIncrementProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function NumberFieldIncrement({
  as,
  disabled,
  onClick,
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

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={as === undefined || as === "button" ? "button" : undefined}
      tabIndex={props.tabIndex ?? -1}
      aria-controls={props["aria-controls"] ?? numberField.controlId}
      aria-label={ariaLabel}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        const input = numberField.inputRef.current;
        if (!input) return;
        input.stepUp();
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        numberField.announceValue(input.getAttribute("aria-valuetext") ?? input.value);
      }}
    />
  );
}
