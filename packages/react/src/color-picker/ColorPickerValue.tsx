import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useColorPickerContext } from "./color-picker-shared.js";

export type ColorPickerValueProps = ComponentProps<"span"> & AsProp;

export function ColorPickerValue({ as, children, ...props }: ColorPickerValueProps) {
  const colorPicker = useColorPickerContext("ColorPickerValue");

  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      data-slot={dataSlot(props, "color-picker-value")}
      data-value={colorPicker.value}
    >
      {children ?? colorPicker.value}
    </Part>
  );
}
