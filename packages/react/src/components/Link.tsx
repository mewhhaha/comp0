import {
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
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
  let resolvedTabIndex = tabIndex;
  if (disabled) resolvedTabIndex = -1;
  else if (!isNativeAnchor) resolvedTabIndex = tabIndex ?? 0;
  let role = (props as Record<string, unknown>).role;
  if (!isNativeAnchor || disabled || !href) role = role ?? "link";
  const mergedProps = mergeProps<Record<string, unknown>>(
    props as Record<string, unknown>,
    mergeInteractionProps(focusProps, hoverProps) as Record<string, unknown>,
    {
      ref,
      href: disabled ? undefined : href,
      tabIndex: resolvedTabIndex,
      role,
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
      onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        if (isNativeAnchor || disabled || event.key !== "Enter") return;
        // Custom elements that still render a real anchor activate natively.
        if (event.currentTarget instanceof HTMLAnchorElement) return;
        event.currentTarget.click();
      },
    },
  );

  return <Component {...mergedProps} />;
}
