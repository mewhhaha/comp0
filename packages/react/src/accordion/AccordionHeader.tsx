import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type AccordionHeaderProps = ComponentProps<"h3"> &
  AsProp & {
    level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  };

export function AccordionHeader({ as, level = 3, ...props }: AccordionHeaderProps) {
  const Part = partElement(as, `h${level}`);
  return <Part data-slot="accordion-header" {...props} />;
}
