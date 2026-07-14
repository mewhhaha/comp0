import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type NumberFieldDecrementProps, useNumberFieldContext } from "./range-shared.js";
export type { NumberFieldDecrementProps } from "./range-shared.js";

export function NumberFieldDecrement({
  disabled,
  onClick,
  ref,
  ...props
}: NumberFieldDecrementProps & RefProp<HTMLButtonElement>) {
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
        input.stepDown();
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        numberField.announceValue(input.getAttribute("aria-valuetext") ?? input.value);
      }}
    />
  );
}
