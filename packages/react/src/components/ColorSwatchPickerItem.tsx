import { type CSSProperties } from "react";
import { type RefProp } from "../shared.js";
import { Radio, type RadioProps } from "./Radio.js";
import { normalizeHexColor } from "./color-picker-shared.js";

type ColorSwatchPickerItemOwnProps = {
  color: string;
};

export type ColorSwatchPickerItemProps = ColorSwatchPickerItemOwnProps &
  Omit<RadioProps, keyof ColorSwatchPickerItemOwnProps | "value">;

export function ColorSwatchPickerItem({
  "aria-label": ariaLabel,
  color,
  inputProps,
  ref,
  style,
  ...props
}: ColorSwatchPickerItemProps & RefProp<HTMLLabelElement>) {
  const value = normalizeHexColor(color);
  if (!value) throw new Error(`ColorSwatchPickerItem color "${color}" must be a hex color.`);

  return (
    <Radio
      {...props}
      ref={ref}
      value={value}
      inputProps={{ "aria-label": ariaLabel ?? value, ...inputProps }}
      data-value={value}
      style={{ ...style, backgroundColor: value } as CSSProperties}
    />
  );
}
