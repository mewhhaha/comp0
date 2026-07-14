import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type NumberFieldIncrementProps, useNumberFieldContext } from "./range-shared.js";
export type { NumberFieldIncrementProps } from "./range-shared.js";

export function NumberFieldIncrement({
  disabled,
  onClick,
  ref,
  ...props
}: NumberFieldIncrementProps & RefProp<HTMLButtonElement>) {
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

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      tabIndex={props.tabIndex ?? -1}
      aria-controls={props["aria-controls"] ?? numberField.controlId}
      aria-label={ariaLabel}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
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
