import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type SelectOptGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Native optgroup-style name announced before its options. */
  label: string;
};

export function SelectOptGroup({
  "aria-label": ariaLabel,
  label,
  ref,
  ...props
}: SelectOptGroupProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role="group" aria-label={ariaLabel ?? label} />;
}
