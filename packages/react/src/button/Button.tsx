import {
  Fragment,
  type ButtonHTMLAttributes,
  type ComponentPropsWithRef,
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { dataAttr, mergeProps, useFocusRing, useHover, usePress } from "@comp0/core";
import { disabledProps } from "../internal/disabled.js";
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
  let role = (props as Record<string, unknown>).role;
  let tabIndex = (props as Record<string, unknown>).tabIndex;
  if (isNativeButton) {
    if (isButtonTag) type = (props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button";
  } else {
    role = role ?? "button";
    tabIndex = tabIndex ?? 0;
  }
  // aria-disabled elements still receive pointer clicks; the helper swallows them.
  const disabledAttributes = disabledProps<HTMLElement>(disabled, {
    native: isButtonTag,
    onClick: onClick as ((event: ReactMouseEvent<HTMLElement>) => void) | undefined,
  });
  const mergedProps: Record<string, unknown> = mergeProps(
    props as Record<string, unknown>,
    focusProps,
    hoverProps,
    pressProps,
    {
      type,
      ...disabledAttributes,
      role,
      tabIndex,
      "aria-busy": resolvedPending || undefined,
      "data-focused": dataAttr(isFocused),
      "data-focus-visible": dataAttr(isFocusVisible),
      "data-hovered": dataAttr(isHovered),
      "data-pressed": dataAttr(isPressed),
      "data-pending": dataAttr(resolvedPending),
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
  return <Part {...mergedProps} ref={ref} />;
}
