import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type SelectOptGroupProps = Omit<ComponentProps<"div">, "role"> &
  AsProp & {
    /** Native optgroup-style name announced before its options. */
    label: string;
  };

export function SelectOptGroup({
  as,
  "aria-label": ariaLabel,
  label,
  ...props
}: SelectOptGroupProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role="group" aria-label={ariaLabel ?? label} />;
}
