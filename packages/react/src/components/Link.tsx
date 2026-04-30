import { type AnchorHTMLAttributes, type MouseEvent as ReactMouseEvent } from "react";
import {
  Slot,
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useFocusRing,
  useHover,
} from "@comp0/core";
import {
  resolveChildren,
  resolveClassName,
  type AsChildProps,
  type SharedStateProps,
  type RefProp,
} from "../shared.js";

export type LinkState = {
  disabled: boolean;
  focused: boolean;
  focusVisible: boolean;
  hovered: boolean;
};

export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className" | "aria-disabled"
> &
  SharedStateProps<LinkState> &
  AsChildProps & {
    disabled?: boolean | undefined;
  };

export function Link({
  asChild,
  children,
  className,
  disabled: disabledProp,
  onClick,
  href,
  tabIndex,
  ref,
  ...props
}: LinkProps & RefProp<HTMLAnchorElement>) {
  const disabled = Boolean(disabledProp);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLAnchorElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLAnchorElement>({ disabled });
  const state: LinkState = {
    disabled,
    focused: isFocused,
    focusVisible: isFocusVisible,
    hovered: isHovered,
  };
  const Component = asChild ? Slot : "a";
  const mergedProps = mergeProps<Record<string, unknown>>(
    props as Record<string, unknown>,
    mergeInteractionProps(focusProps, hoverProps) as Record<string, unknown>,
    {
      ref,
      href: disabled ? undefined : href,
      tabIndex: disabled ? -1 : tabIndex,
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
