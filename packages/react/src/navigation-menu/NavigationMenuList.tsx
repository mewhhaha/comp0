import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type NavigationMenuListProps = ComponentProps<"ul"> & AsProp;

export function NavigationMenuList({ as, ...props }: NavigationMenuListProps) {
  const Part = partElement(as, "ul");
  return <Part data-comp0="navigation-menu-list" {...props} />;
}
