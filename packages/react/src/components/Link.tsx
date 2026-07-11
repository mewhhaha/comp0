import {
  type ComponentPropsWithRef,
  type ElementType,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, mergeInteractionProps, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { resolveChildren, resolveClassName, type SharedStateProps } from "../shared.js";

export type LinkState = {
  disabled: boolean;
  focused: boolean;
  focusVisible: boolean;
  hovered: boolean;
};

type LinkOwnProps = SharedStateProps<LinkState> & {
  disabled?: boolean | undefined;
  href?: string | undefined;
};

export type LinkProps<TElement extends ElementType = "a"> = LinkOwnProps &
  Omit<ComponentPropsWithRef<TElement>, keyof LinkOwnProps | "as" | "children" | "className"> & {
    as?: TElement | undefined;
  };

export function Link<TElement extends ElementType = "a">({
  as,
  children,
  className,
  disabled: disabledProp,
  onClick,
  href,
  tabIndex,
  ref,
  ...props
}: LinkProps<TElement>) {
  const disabled = Boolean(disabledProp);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLAnchorElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLAnchorElement>({ disabled });
  const state: LinkState = {
    disabled,
    focused: isFocused,
    focusVisible: isFocusVisible,
    hovered: isHovered,
  };
  const Component = as ?? "a";
  const isNativeAnchor = Component === "a";
  const mergedProps = mergeProps<Record<string, unknown>>(
    props as Record<string, unknown>,
    mergeInteractionProps(focusProps, hoverProps) as Record<string, unknown>,
    {
      ref,
      href: disabled ? undefined : href,
      tabIndex: disabled ? -1 : tabIndex,
      role: isNativeAnchor ? undefined : ((props as Record<string, unknown>).role ?? "link"),
      "aria-disabled": disabled || undefined,
      "data-disabled": dataAttr(disabled),
      "data-focused": dataAttr(isFocused),
      "data-focus-visible": dataAttr(isFocusVisible),
      "data-hovered": dataAttr(isHovered),
      className: resolveClassName(className, state),
      children: resolveChildren(children, state),
      onClick(event: ReactMouseEvent<HTMLAnchorElement>) {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      },
    },
  );

  return <Component {...mergedProps} />;
}
