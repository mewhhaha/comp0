import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TreeGridRowGroupProps = ComponentProps<"tbody"> & AsProp;

/** A `tbody` by default; pass `as="thead"` for the header rows. */
export function TreeGridRowGroup({ as, ...props }: TreeGridRowGroupProps) {
  const Part = partElement(as, "tbody");
  return <Part {...props} role="rowgroup" />;
}
