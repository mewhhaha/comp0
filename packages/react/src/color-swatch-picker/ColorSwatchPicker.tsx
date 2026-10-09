import { normalizeHexColorProp } from "../color-picker/color-picker-shared.js";
import { useWarnOnce } from "../internal/dev.js";
import { RadioGroup, type RadioGroupProps } from "../radio/RadioGroup.js";

export type ColorSwatchPickerProps = RadioGroupProps;

export function ColorSwatchPicker({ defaultValue, value, ...props }: ColorSwatchPickerProps) {
  const warn = useWarnOnce();
  let normalizedValue = value;
  if (value !== undefined && value !== "") {
    normalizedValue = normalizeHexColorProp(warn, "ColorSwatchPicker", "value", value);
  }
  let normalizedDefault = defaultValue;
  if (defaultValue !== undefined && defaultValue !== "") {
    normalizedDefault = normalizeHexColorProp(
      warn,
      "ColorSwatchPicker",
      "defaultValue",
      defaultValue,
    );
  }

  return <RadioGroup {...props} value={normalizedValue} defaultValue={normalizedDefault} />;
}
