import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useColorPickerContext } from "./color-picker-shared.js";

export type ColorPickerValueProps = HTMLAttributes<HTMLSpanElement>;

export function ColorPickerValue({
  children,
  ref,
  ...props
}: ColorPickerValueProps & RefProp<HTMLSpanElement>) {
  const colorPicker = useColorPickerContext("ColorPickerValue");

  return (
    <span {...props} ref={ref} data-value={colorPicker.value}>
      {children ?? colorPicker.value}
    </span>
  );
}
