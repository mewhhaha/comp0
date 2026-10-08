import { type ComponentPropsWithRef, type ElementType, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useNavigationMenuContext } from "./navigation-menu-shared.js";

type NavigationMenuLinkOwnProps = {
  /** Marks the page you are on with aria-current="page". */
  current?: boolean | undefined;
};

/** Generic over `as` so router links keep their own props, such as `to`. */
export type NavigationMenuLinkProps<TElement extends ElementType = "a"> =
  NavigationMenuLinkOwnProps &
    Omit<ComponentPropsWithRef<TElement>, keyof NavigationMenuLinkOwnProps | "as"> & {
      as?: TElement | undefined;
    };

export function NavigationMenuLink<TElement extends ElementType = "a">({
  as,
  current,
  onClick,
  ...props
}: NavigationMenuLinkProps<TElement>) {
  const menu = useNavigationMenuContext("NavigationMenuLink");

  const Part = partElement(as, "a");
  return (
    <Part
      {...props}
      aria-current={current ? "page" : undefined}
      data-current={dataAttr(Boolean(current))}
      data-slot={dataSlot(props as Record<string, unknown>, "navigation-menu-link")}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        (onClick as ((clickEvent: MouseEvent<HTMLAnchorElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) menu.close();
      }}
    />
  );
}
