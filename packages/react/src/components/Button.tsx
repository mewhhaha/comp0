import {
  type ButtonHTMLAttributes,
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useFocusRing,
  useHover,
  usePress,
} from "@comp0/core";
import {
  resolveChildren,
  resolveClassName,
  type CommandAttributeProps,
  type SharedStateProps,
} from "../shared.js";

export type ButtonState = {
  disabled: boolean;
  focused: boolean;
  focusVisible: boolean;
  hovered: boolean;
  pressed: boolean;
  pending: boolean;
};

type ButtonOwnProps = SharedStateProps<ButtonState> &
  CommandAttributeProps & {
    disabled?: boolean | undefined;
    pending?: boolean | undefined;
  };

export type ButtonProps<TElement extends ElementType = "button"> = ButtonOwnProps &
  Omit<ComponentPropsWithRef<TElement>, keyof ButtonOwnProps | "as" | "children" | "className"> & {
    as?: TElement | undefined;
  };

export function Button<TElement extends ElementType = "button">({
  as,
  children,
  className,
  disabled: disabledProp,
  onClick,
  pending,
  ref,
  ...props
}: ButtonProps<TElement>) {
  const resolvedPending = Boolean(pending);
  const disabled = Boolean(disabledProp || resolvedPending);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLButtonElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLButtonElement>({ disabled });
  const { pressProps, isPressed } = usePress<HTMLButtonElement>({ disabled });
  const state: ButtonState = {
    disabled,
    focused: isFocused,
    focusVisible: isFocusVisible,
    hovered: isHovered,
    pressed: isPressed,
    pending: resolvedPending,
  };
  const Component = as ?? "button";
  const isNativeButton = Component === "button";
  let type: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  let nativeDisabled: boolean | undefined;
  let ariaDisabled: boolean | undefined;
  let role = (props as Record<string, unknown>).role;
  let tabIndex = (props as Record<string, unknown>).tabIndex;
  if (isNativeButton) {
    type = (props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button";
    nativeDisabled = disabled;
  } else {
    ariaDisabled = disabled || undefined;
    role = role ?? "button";
    tabIndex = tabIndex ?? 0;
  }
  const mergedProps = mergeProps<Record<string, unknown>>(
    props as Record<string, unknown>,
    mergeInteractionProps(focusProps, hoverProps, pressProps) as Record<string, unknown>,
    {
      ref,
      type,
      disabled: nativeDisabled,
      "aria-disabled": ariaDisabled,
      role,
      tabIndex,
      "aria-busy": resolvedPending || undefined,
      "data-disabled": dataAttr(disabled),
      "data-focused": dataAttr(isFocused),
      "data-focus-visible": dataAttr(isFocusVisible),
      "data-hovered": dataAttr(isHovered),
      "data-pressed": dataAttr(isPressed),
      "data-pending": dataAttr(resolvedPending),
      className: resolveClassName(className, state),
      children: resolveChildren(children, state),
      onClick(event: ReactMouseEvent<HTMLElement>) {
        // aria-disabled elements still receive pointer clicks; swallow them.
        if (!isNativeButton && disabled) {
          event.preventDefault();
          return;
        }
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
      },
      onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        if (isNativeButton || disabled) return;
        if (event.key === " ") event.preventDefault();
        if (event.key === "Enter") event.currentTarget.click();
      },
      onKeyUp(event: ReactKeyboardEvent<HTMLElement>) {
        if (isNativeButton || disabled || event.key !== " ") return;
        event.preventDefault();
        event.currentTarget.click();
      },
    },
  );

  return <Component {...mergedProps} />;
}
