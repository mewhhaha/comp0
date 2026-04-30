import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
export function ColorSwatchPicker(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role="listbox" data-slot="color-swatch-picker" />;
}
