import { useId, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { NavigationMenuItemContext, useNavigationMenuContext } from "./navigation-menu-shared.js";

export type NavigationMenuItemProps = Omit<ComponentProps<"li">, "value"> &
  AsProp & {
    /** Identity that pairs this item's trigger with its content panel. */
    value: string;
  };

export function NavigationMenuItem({ as, value, id, ...props }: NavigationMenuItemProps) {
  const warn = useWarnOnce();
  const menu = useNavigationMenuContext("NavigationMenuItem");
  const generatedId = useId();
  const itemId = id ?? `${generatedId}-${value}`;
  if (!value) {
    warn(
      `NavigationMenuItem:empty-value:${itemId}`,
      `NavigationMenuItem requires a non-empty value; received ${JSON.stringify(value)}. It stays closed.`,
    );
  }
  const open = value !== "" && menu.value === value;

  const Part = partElement(as, "li");
  return (
    <NavigationMenuItemContext
      value={{
        value,
        open,
        triggerId: `${itemId}-trigger`,
        panelId: `${itemId}-panel`,
      }}
    >
      <Part data-slot="navigation-menu-item" {...props} id={id} data-open={dataAttr(open)} />
    </NavigationMenuItemContext>
  );
}
