import { normalizeHexColorProp } from "../color-picker/color-picker-shared.js";
import { RadioGroup, type RadioGroupProps } from "../radio/RadioGroup.js";

export type ColorSwatchPickerProps = RadioGroupProps;

export function ColorSwatchPicker({ defaultValue, value, ...props }: ColorSwatchPickerProps) {
  let normalizedValue = value;
  if (value !== undefined && value !== "") {
    normalizedValue = normalizeHexColorProp("ColorSwatchPicker", "value", value);
  }
  let normalizedDefault = defaultValue;
  if (defaultValue !== undefined && defaultValue !== "") {
    normalizedDefault = normalizeHexColorProp("ColorSwatchPicker", "defaultValue", defaultValue);
  }

  return <RadioGroup {...props} value={normalizedValue} defaultValue={normalizedDefault} />;
}
