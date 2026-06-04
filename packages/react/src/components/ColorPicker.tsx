import { type RefProp } from "../shared.js";
import { ColorField } from "./ColorField.js";
import { type ColorFieldProps } from "./color-shared.js";
export function ColorPicker(props: ColorFieldProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <ColorField {...props} ref={ref} data-slot="color-picker" />;
}
