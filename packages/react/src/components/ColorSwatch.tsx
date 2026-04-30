import { type RefProp } from "../shared.js";
import { useContext, type CSSProperties } from "react";
import { ColorContext } from "./color-shared.js";
import { type ColorSwatchProps } from "./color-shared.js";
export type { ColorSwatchProps } from "./color-shared.js";
export function ColorSwatch({
  color,
  style,
  ref,
  ...props
}: ColorSwatchProps & RefProp<HTMLDivElement>) {
  const context = useContext(ColorContext);
  const value = color ?? context?.value;
  return (
    <div
      {...props}
      ref={ref}
      data-slot="color-swatch"
      data-value={value}
      style={{ backgroundColor: value, ...(style as CSSProperties) }}
    />
  );
}
