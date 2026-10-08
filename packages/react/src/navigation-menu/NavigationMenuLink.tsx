import { useId, type ComponentPropsWithRef, type ElementType, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";
import {
  useNavigationMenuContext,
  useOptionalNavigationMenuPanelContext,
} from "./navigation-menu-shared.js";

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
  ref,
  ...props
}: NavigationMenuLinkProps<TElement>) {
  const menu = useNavigationMenuContext("NavigationMenuLink");
  const panel = useOptionalNavigationMenuPanelContext();
  const key = useId();
  const linkRef = useComposedRefs(ref, (element: HTMLElement | null) => {
    menu.stops.register({
      key,
      textValue: element?.textContent?.trim() ?? "",
      element,
      kind: "link",
      panel: panel?.value,
      value: undefined,
    });
  });

  const Part = partElement(as, "a");
  return (
    <Part
      data-slot="navigation-menu-link"
      {...props}
      ref={linkRef}
      aria-current={current ? "page" : undefined}
      data-current={dataAttr(Boolean(current))}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        (onClick as ((clickEvent: MouseEvent<HTMLAnchorElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) menu.close();
      }}
    />
  );
}
