import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type ComboboxOptGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Native optgroup-style name announced before its options. */
  label: string;
};

export function ComboboxOptGroup({
  "aria-label": ariaLabel,
  label,
  ref,
  ...props
}: ComboboxOptGroupProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role="group" aria-label={ariaLabel ?? label} />;
}
