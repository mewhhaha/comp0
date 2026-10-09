import { type CSSProperties } from "react";
import { Radio, type RadioProps } from "../radio/Radio.js";
import { useWarnOnce } from "../internal/dev.js";
import { normalizeHexColorProp } from "../color-picker/color-picker-shared.js";

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
  const warn = useWarnOnce();
  const value = normalizeHexColorProp(warn, "ColorSwatchPickerItem", "color", color);
  // An invalid color has no value to submit, so the item is skipped.
  if (!value) return null;

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
