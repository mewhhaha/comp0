import {
  Fragment,
  type ButtonHTMLAttributes,
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, mergeProps, useFocusRing, useHover, usePress } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";
import { type CommandAttributeProps } from "../internal/shared.js";

type ButtonOwnProps = CommandAttributeProps & {
  disabled?: boolean | undefined;
  pending?: boolean | undefined;
};

export type ButtonProps<TElement extends ElementType = "button"> = ButtonOwnProps &
  Omit<ComponentPropsWithRef<TElement>, keyof ButtonOwnProps | "as"> & {
    as?: TElement | undefined;
  };

export function Button<TElement extends ElementType = "button">({
  as,
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
  const isButtonTag = as === undefined || as === "button";
  // A Fragment child brings its own semantics, so it gets no synthesized role or keys.
  const isNativeButton = isButtonTag || (as as ElementType | undefined) === Fragment;
  let type: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  let nativeDisabled: boolean | undefined;
  let ariaDisabled: boolean | undefined;
  let role = (props as Record<string, unknown>).role;
  let tabIndex = (props as Record<string, unknown>).tabIndex;
  if (isNativeButton) {
    if (isButtonTag) {
      type = (props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button";
      nativeDisabled = disabled;
    } else {
      ariaDisabled = disabled || undefined;
    }
  } else {
    ariaDisabled = disabled || undefined;
    role = role ?? "button";
    tabIndex = tabIndex ?? 0;
  }
  const mergedProps: Record<string, unknown> = mergeProps(
    props as Record<string, unknown>,
    focusProps,
    hoverProps,
    pressProps,
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

  const Part = partElement(as, "button");
  return <Part {...mergedProps} />;
}
