import { type ComponentProps, type CSSProperties } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useColorAreaContext } from "./color-picker-shared.js";

export type ColorAreaThumbProps = ComponentProps<"div"> & AsProp;

export function ColorAreaThumb({ as, style, ...props }: ColorAreaThumbProps) {
  const colorArea = useColorAreaContext("ColorAreaThumb");

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      aria-hidden={props["aria-hidden"] ?? true}
      data-slot={dataSlot(props, "color-area-thumb")}
      data-disabled={dataAttr(colorArea.disabled)}
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
