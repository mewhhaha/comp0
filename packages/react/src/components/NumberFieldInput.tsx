import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { Input } from "./Input.js";
import { type NumberFieldInputProps, useNumberFieldContext } from "./range-shared.js";
import { useFormReset } from "./form-control-state.js";
export type { NumberFieldInputProps } from "./range-shared.js";

export function NumberFieldInput({
  onChange,
  ref,
  ...props
}: NumberFieldInputProps & RefProp<HTMLInputElement>) {
  const numberField = useNumberFieldContext("NumberFieldInput");
  useFormReset({
    controlRef: numberField.inputRef,
    controlled: numberField.controlled,
    form: props.form,
    resetValue: numberField.resetValue,
    restoreValue: numberField.restoreValue,
    readValue: (element) => element.valueAsNumber,
  });

  return (
    <Input
      {...props}
      ref={composeRefs(ref, numberField.inputRef)}
      id={numberField.controlId}
      type="number"
      value={Number.isNaN(numberField.value) ? "" : numberField.value}
      name={numberField.name}
      min={numberField.min}
      max={numberField.max}
      step={numberField.step}
      disabled={numberField.disabled}
      required={numberField.required}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented) numberField.setValue(event.currentTarget.valueAsNumber);
      }}
    />
  );
}
