import { type ComponentProps } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ListBoxOptGroupProps = ComponentProps<"div"> & AsProp;

export function ListBoxOptGroup({ as, ...props }: ListBoxOptGroupProps) {
  // A collection pass only needs the options inside the group.
  const collecting = useIsCollectionPass();
  if (collecting) return props.children;
  const Part = partElement(as, "div");
  return <Part {...props} role={props.role ?? "group"} />;
}
