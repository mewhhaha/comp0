import {
  useContext,
  type ComponentPropsWithRef,
  type ElementType,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot } from "../shared.js";
import { NavigationMenuContext } from "./navigation-menu-shared.js";

type NavigationMenuLinkOwnProps = {
  /** Marks the page you are on with aria-current="page". */
  current?: boolean | undefined;
};

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
  const menu = useContext(NavigationMenuContext);
  const Component: ElementType = as ?? "a";
  return (
    <Component
      {...props}
      aria-current={current ? "page" : undefined}
      data-current={dataAttr(Boolean(current))}
      data-slot={dataSlot(props as Record<string, unknown>, "navigation-menu-link")}
      onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLAnchorElement>) => void) | undefined)?.(
          event,
        );
        if (!event.defaultPrevented) menu?.close();
      }}
    />
  );
}
