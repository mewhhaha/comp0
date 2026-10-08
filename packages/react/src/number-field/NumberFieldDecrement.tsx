import { dataAttr } from "@comp0/core";
import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useNumberFieldContext } from "./number-field-shared.js";

export type NumberFieldDecrementProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function NumberFieldDecrement({
  as,
  disabled,
  onClick,
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
        input.stepDown();
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        numberField.announceValue(input.getAttribute("aria-valuetext") ?? input.value);
      }}
    />
  );
}
