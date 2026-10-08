import { type CSSProperties } from "react";
import { Radio, type RadioProps } from "../radio/Radio.js";
import { normalizeHexColor } from "../color-picker/color-picker-shared.js";

type ColorSwatchPickerItemOwnProps = {
  color: string;
};

export type ColorSwatchPickerItemProps = ColorSwatchPickerItemOwnProps &
  Omit<RadioProps, keyof ColorSwatchPickerItemOwnProps | "value">;

export function ColorSwatchPickerItem({
  "aria-label": ariaLabel,
  color,
  inputProps,
  style,
  ...props
}: ColorSwatchPickerItemProps) {
  const value = normalizeHexColor(color);
  if (!value) throw new Error(`ColorSwatchPickerItem color "${color}" must be a hex color.`);

  return (
    <Radio
      {...props}
      value={value}
      inputProps={{ "aria-label": ariaLabel ?? value, ...inputProps }}
      data-value={value}
      style={{ ...style, backgroundColor: value } as CSSProperties}
    />
  );
}
