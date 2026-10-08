import { type ComponentProps, type CSSProperties } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { normalizeHexColor, useOptionalColorPickerContext } from "./color-picker-shared.js";

export type ColorSwatchProps = ComponentProps<"span"> &
  AsProp & {
    color?: string | undefined;
  };

export function ColorSwatch({ as, color, style, ...props }: ColorSwatchProps) {
  const colorPicker = useOptionalColorPickerContext();
  if (color === undefined && !colorPicker) {
    throw new Error("ColorSwatch needs a color when rendered outside ColorPicker.");
  }
  const value = color === undefined ? colorPicker?.value : normalizeHexColor(color);
  if (!value) throw new Error(`ColorSwatch color "${color}" must be a hex color.`);

  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      aria-hidden={props["aria-hidden"] ?? true}
      data-slot={dataSlot(props, "color-swatch")}
      data-value={value}
      style={{ ...style, backgroundColor: value } as CSSProperties}
    />
  );
}
