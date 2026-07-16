import { useContext, useId, type LiHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { NavigationMenuContext, NavigationMenuItemContext } from "./navigation-menu-shared.js";

export type NavigationMenuItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "value"> & {
  /** Identity that pairs this item's trigger with its content panel. */
  value: string;
};

export function NavigationMenuItem({
  value,
  id,
  ref,
  ...props
}: NavigationMenuItemProps & RefProp<HTMLLIElement>) {
  const menu = useContext(NavigationMenuContext);
  const generatedId = useId();
  if (!value) {
    throw new Error(
      `NavigationMenuItem requires a non-empty value; received ${JSON.stringify(value)}.`,
    );
  }
  const itemId = id ?? `${generatedId}-${value}`;
  const open = menu?.value === value;

  return (
    <NavigationMenuItemContext
      value={{
        value,
        open,
        triggerId: `${itemId}-trigger`,
        contentId: `${itemId}-content`,
      }}
    >
      <li
        {...props}
        ref={ref}
        id={id}
        data-slot={dataSlot(props, "navigation-menu-item")}
        data-open={dataAttr(open)}
      />
    </NavigationMenuItemContext>
  );
}
