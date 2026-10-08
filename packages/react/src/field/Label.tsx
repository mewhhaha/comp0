import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFieldContext } from "./field-shared.js";

export type LabelProps = ComponentProps<"label"> & AsProp;

export function Label({ as, id, htmlFor, ...props }: LabelProps) {
  const field = useFieldContext();
  const Part = partElement(as, "label");
  return <Part {...props} id={id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} />;
}
