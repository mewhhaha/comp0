import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ListBoxOptGroupProps = ComponentProps<"div"> & AsProp;

export function ListBoxOptGroup({ as, ...props }: ListBoxOptGroupProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role={props.role ?? "group"} />;
}
