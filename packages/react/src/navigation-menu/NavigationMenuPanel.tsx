import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  NavigationMenuPanelContext,
  useNavigationMenuItemContext,
} from "./navigation-menu-shared.js";

export type NavigationMenuPanelProps = ComponentProps<"div"> & AsProp;

/**
 * Inline panel, not a top-layer popover: it stays in the page flow so
 * consumers can position mega-menus with plain CSS relative to the nav.
 */
export function NavigationMenuPanel({ as, hidden, id, ...props }: NavigationMenuPanelProps) {
  const item = useNavigationMenuItemContext("NavigationMenuPanel");

  const Part = partElement(as, "div");
  return (
    <NavigationMenuPanelContext value={{ value: item.value }}>
      <Part
        data-slot="navigation-menu-panel"
        {...props}
        id={id ?? item.panelId}
        hidden={hidden ?? !item.open}
        data-open={dataAttr(item.open)}
      />
    </NavigationMenuPanelContext>
  );
}
