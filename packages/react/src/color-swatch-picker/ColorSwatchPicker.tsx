import { normalizeHexColor } from "../color-picker/color-picker-shared.js";
import { RadioGroup, type RadioGroupProps } from "../radio/RadioGroup.js";

export type ColorSwatchPickerProps = RadioGroupProps;

export function ColorSwatchPicker({ defaultValue, value, ...props }: ColorSwatchPickerProps) {
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

  return <RadioGroup {...props} value={normalizedValue} defaultValue={normalizedDefault} />;
}
