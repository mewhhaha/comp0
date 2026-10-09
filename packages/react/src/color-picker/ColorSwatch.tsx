import { type ComponentProps, type CSSProperties } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { normalizeHexColorProp, useOptionalColorPickerContext } from "./color-picker-shared.js";

export type ColorSwatchProps = ComponentProps<"span"> &
  AsProp & {
    color?: string | undefined;
  };

export function ColorSwatch({ as, color, style, ...props }: ColorSwatchProps) {
  const warn = useWarnOnce();
  const colorPicker = useOptionalColorPickerContext();
  let value = colorPicker?.value;
  if (color !== undefined) value = normalizeHexColorProp(warn, "ColorSwatch", "color", color);
  if (color === undefined && !colorPicker) {
    warn(
      "ColorSwatch:missing-color",
      "ColorSwatch needs a color when rendered outside ColorPicker. It was left unpainted.",
    );
  }

  const Part = partElement(as, "span");
  return (
    <Part
      data-slot="color-swatch"
      {...props}
      aria-hidden={props["aria-hidden"] ?? true}
      data-value={value}
      style={{ ...style, backgroundColor: value } as CSSProperties}
    />
  );
}
