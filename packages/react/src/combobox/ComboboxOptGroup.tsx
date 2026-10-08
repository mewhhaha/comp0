import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ComboboxOptGroupProps = Omit<ComponentProps<"div">, "role"> &
  AsProp & {
    /** Native optgroup-style name announced before its options. */
    label: string;
  };

export function ComboboxOptGroup({
  as,
  "aria-label": ariaLabel,
  label,
  ...props
}: ComboboxOptGroupProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role="group" aria-label={ariaLabel ?? label} />;
}
