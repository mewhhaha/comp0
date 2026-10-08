import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type NavigationMenuListProps = ComponentProps<"ul"> & AsProp;

export function NavigationMenuList({ as, ...props }: NavigationMenuListProps) {
  const Part = partElement(as, "ul");
  return <Part {...props} data-slot={dataSlot(props, "navigation-menu-list")} />;
}
