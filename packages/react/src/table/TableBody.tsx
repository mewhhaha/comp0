import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TableBodyProps = ComponentProps<"tbody"> & AsProp;

export function TableBody({ as, ...props }: TableBodyProps) {
  const Part = partElement(as, "tbody");
  return <Part {...props} />;
}
