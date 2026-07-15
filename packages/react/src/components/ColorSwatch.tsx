import { useContext, type CSSProperties, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ColorPickerContext, normalizeHexColor } from "./color-picker-shared.js";

export type ColorSwatchProps = HTMLAttributes<HTMLSpanElement> & {
  color?: string | undefined;
};

export function ColorSwatch({
  color,
  ref,
  style,
  ...props
}: ColorSwatchProps & RefProp<HTMLSpanElement>) {
  const colorPicker = useContext(ColorPickerContext);
  if (color === undefined && !colorPicker) {
    throw new Error("ColorSwatch needs a color when rendered outside ColorPicker.");
  }
  const value = color === undefined ? colorPicker?.value : normalizeHexColor(color);
  if (!value) throw new Error(`ColorSwatch color "${color}" must be a hex color.`);

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden={props["aria-hidden"] ?? true}
      data-value={value}
      style={{ ...style, backgroundColor: value } as CSSProperties}
    />
  );
}
