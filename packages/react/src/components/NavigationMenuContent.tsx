import { useContext, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { NavigationMenuItemContext } from "./navigation-menu-shared.js";

export type NavigationMenuContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * Inline panel, not a top-layer popover: it stays in the page flow so
 * consumers can position mega-menus with plain CSS relative to the nav.
 */
export function NavigationMenuContent({
  hidden,
  id,
  ref,
  ...props
}: NavigationMenuContentProps & RefProp<HTMLDivElement>) {
  const item = useContext(NavigationMenuItemContext);
  const open = item?.open ?? false;
  return (
    <div
      {...props}
      ref={ref}
      id={id ?? item?.contentId}
      hidden={hidden ?? !open}
      data-slot={dataSlot(props, "navigation-menu-content")}
      data-open={dataAttr(open)}
    />
  );
}
