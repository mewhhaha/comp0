import { Checkbox, type CheckboxProps } from "../checkbox/Checkbox.js";

// A switch is on or off; the checkbox mixed state has no valid switch ARIA.
export type SwitchProps = Omit<CheckboxProps, "indeterminate">;

export function Switch(props: SwitchProps) {
  return <Checkbox {...props} inputProps={{ ...props.inputProps, role: "switch" }} />;
}
