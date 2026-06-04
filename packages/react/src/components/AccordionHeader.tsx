import { createElement } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { type AccordionHeaderProps } from "./accordion-shared.js";
export type { AccordionHeaderProps } from "./accordion-shared.js";

export function AccordionHeader({
  level = 3,
  ref,
  ...props
}: AccordionHeaderProps & RefProp<HTMLHeadingElement>) {
  return createElement(`h${level}`, {
    ...props,
    ref,
    "data-slot": dataSlot(props, "accordion-header"),
  });
}
