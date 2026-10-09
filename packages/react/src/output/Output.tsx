import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type OutputProps = Omit<ComponentProps<"output">, "htmlFor"> &
  AsProp & {
    /** The ids of the controls the result is computed from; a list is joined with spaces. */
    htmlFor?: string | string[] | undefined;
  };

/**
 * The native output element: the result of a calculation, such as a price
 * driven by a slider. Its implicit status role announces changes politely, so
 * keep the content to the result itself. `htmlFor` lists the controls it is
 * computed from, and `name` and `form` submit it with the form like any
 * other listed element.
 */
export function Output({ as, htmlFor, ...props }: OutputProps) {
  let controls = htmlFor;
  if (Array.isArray(htmlFor)) controls = htmlFor.join(" ");

  const Part = partElement(as, "output");
  return <Part data-slot="output" {...props} htmlFor={controls as string | undefined} />;
}
