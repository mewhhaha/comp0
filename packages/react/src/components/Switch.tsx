import { type RefProp } from "../shared.js";
import { Checkbox } from "./Checkbox.js";
import { type SwitchProps } from "./choices-shared.js";
export type { SwitchProps } from "./choices-shared.js";
export function Switch(props: SwitchProps & RefProp<HTMLLabelElement>) {
  const { ref } = props;
  return (
    <Checkbox
      {...props}
      ref={ref}
      inputProps={{ ...props.inputProps, role: "switch" }}
      data-switch=""
    />
  );
}
