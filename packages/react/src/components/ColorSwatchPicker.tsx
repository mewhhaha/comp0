import { type RefProp } from "../shared.js";
import { normalizeHexColor } from "./color-picker-shared.js";
import { RadioGroup, type RadioGroupProps } from "./RadioGroup.js";

export type ColorSwatchPickerProps = RadioGroupProps;

export function ColorSwatchPicker({
  defaultValue,
  ref,
  value,
  ...props
}: ColorSwatchPickerProps & RefProp<HTMLFieldSetElement>) {
  const normalizedValue = value === undefined || value === "" ? value : normalizeHexColor(value);
  if (value !== undefined && value !== "" && !normalizedValue) {
    throw new Error(`ColorSwatchPicker value "${value}" must be a hex color.`);
  }
  let normalizedDefault = defaultValue;
  if (defaultValue !== undefined && defaultValue !== "") {
    normalizedDefault = normalizeHexColor(defaultValue);
  }
  if (defaultValue !== undefined && defaultValue !== "" && !normalizedDefault) {
    throw new Error(`ColorSwatchPicker defaultValue "${defaultValue}" must be a hex color.`);
  }

  return (
    <RadioGroup {...props} ref={ref} value={normalizedValue} defaultValue={normalizedDefault} />
  );
}
