import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

export type NavigationMenuListProps = HTMLAttributes<HTMLUListElement>;

export function NavigationMenuList({
  ref,
  ...props
}: NavigationMenuListProps & RefProp<HTMLUListElement>) {
  return <ul {...props} ref={ref} data-slot={dataSlot(props, "navigation-menu-list")} />;
}
