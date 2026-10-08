import {
  Fragment,
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";

type LinkOwnProps = {
  disabled?: boolean | undefined;
  href?: string | undefined;
};

export type LinkProps<TElement extends ElementType = "a"> = LinkOwnProps &
  Omit<ComponentPropsWithRef<TElement>, keyof LinkOwnProps | "as"> & {
    as?: TElement | undefined;
  };

export function Link<TElement extends ElementType = "a">({
  as,
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
  // A Fragment child brings its own semantics, so it gets no synthesized role or keys.
  const isNativeAnchor = as === undefined || as === "a" || (as as ElementType) === Fragment;
  let resolvedTabIndex = tabIndex;
  if (disabled) resolvedTabIndex = -1;
  else if (!isNativeAnchor) resolvedTabIndex = tabIndex ?? 0;
  let role = (props as Record<string, unknown>).role;
  if (!isNativeAnchor || disabled || !href) role = role ?? "link";
  const mergedProps: Record<string, unknown> = mergeProps(
    props as Record<string, unknown>,
    focusProps,
    hoverProps,
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

  const Part = partElement(as, "a");
  return <Part {...mergedProps} />;
}
