import { type CSSProperties, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useColorAreaContext } from "./color-picker-shared.js";

export type ColorAreaThumbProps = HTMLAttributes<HTMLDivElement>;

export function ColorAreaThumb({
  ref,
  style,
  ...props
}: ColorAreaThumbProps & RefProp<HTMLDivElement>) {
  const colorArea = useColorAreaContext("ColorAreaThumb");

  return (
    <div
      {...props}
      ref={ref}
      aria-hidden={props["aria-hidden"] ?? true}
      data-disabled={colorArea.disabled || undefined}
      style={
        {
          ...style,
          left: `${colorArea.color.saturation}%`,
          top: `${100 - colorArea.color.brightness}%`,
        } as CSSProperties
      }
    />
  );
}
