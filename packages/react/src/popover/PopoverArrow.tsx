import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type PopoverArrowProps = ComponentProps<"div"> & AsProp;

export function PopoverArrow({ as, ...props }: PopoverArrowProps) {
  const Part = partElement(as, "div");
  return <Part data-slot="popover-arrow" {...props} aria-hidden={props["aria-hidden"] ?? true} />;
}
