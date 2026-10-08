import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useNavigationMenuItemContext } from "./navigation-menu-shared.js";

export type NavigationMenuContentProps = ComponentProps<"div"> & AsProp;

/**
 * Inline panel, not a top-layer popover: it stays in the page flow so
 * consumers can position mega-menus with plain CSS relative to the nav.
 */
export function NavigationMenuContent({ as, hidden, id, ...props }: NavigationMenuContentProps) {
  const item = useNavigationMenuItemContext("NavigationMenuContent");

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      id={id ?? item.contentId}
      hidden={hidden ?? !item.open}
      data-slot={dataSlot(props, "navigation-menu-content")}
      data-open={dataAttr(item.open)}
    />
  );
}
