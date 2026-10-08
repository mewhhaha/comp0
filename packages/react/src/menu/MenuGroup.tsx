import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type MenuGroupProps = ComponentProps<"div"> & AsProp;

export function MenuGroup({ as, ...props }: MenuGroupProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role={props.role ?? "group"} />;
}
