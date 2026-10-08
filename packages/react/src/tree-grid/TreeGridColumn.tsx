import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TreeGridColumnProps = ComponentProps<"th"> & AsProp;

export function TreeGridColumn({ as, ...props }: TreeGridColumnProps) {
  const Part = partElement(as, "th");
  return <Part {...props} role="columnheader" scope={props.scope ?? "col"} />;
}
