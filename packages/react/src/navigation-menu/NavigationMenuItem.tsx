import { useId, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { NavigationMenuItemContext, useNavigationMenuContext } from "./navigation-menu-shared.js";

export type NavigationMenuItemProps = Omit<ComponentProps<"li">, "value"> &
  AsProp & {
    /** Identity that pairs this item's trigger with its content panel. */
    value: string;
  };

export function NavigationMenuItem({ as, value, id, ...props }: NavigationMenuItemProps) {
  const menu = useNavigationMenuContext("NavigationMenuItem");
  const generatedId = useId();
  if (!value) {
    throw new Error(
      `NavigationMenuItem requires a non-empty value; received ${JSON.stringify(value)}.`,
    );
  }
  const itemId = id ?? `${generatedId}-${value}`;
  const open = menu.value === value;

  const Part = partElement(as, "li");
  return (
    <NavigationMenuItemContext
      value={{
        value,
        open,
        triggerId: `${itemId}-trigger`,
        contentId: `${itemId}-content`,
      }}
    >
      <Part
        {...props}
        id={id}
        data-slot={dataSlot(props, "navigation-menu-item")}
        data-open={dataAttr(open)}
      />
    </NavigationMenuItemContext>
  );
}
