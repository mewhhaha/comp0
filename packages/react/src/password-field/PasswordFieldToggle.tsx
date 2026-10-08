import { type MouseEvent, type PointerEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp } from "../internal/polymorphic.js";
import { Button, type ButtonProps } from "../button/Button.js";
import { useFieldContext } from "../field/field-shared.js";
import { usePasswordFieldContext } from "./password-field-shared.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type PasswordFieldToggleProps = Omit<
  ButtonProps,
  "aria-label" | "aria-labelledby" | "aria-pressed" | "type" | "as"
> &
  AsProp & {
    showLabel?: string | undefined;
    hideLabel?: string | undefined;
  };

export function PasswordFieldToggle({
  as,
  children,
  disabled: disabledProp,
  showLabel = "Show password",
  hideLabel = "Hide password",
  onClick,
  onPointerDown,
  ...props
}: PasswordFieldToggleProps) {
  const field = useFieldContext();
  const passwordField = usePasswordFieldContext("PasswordFieldToggle");
  const { announcement, captureSelection, inputRef, mounted, passwordVisible, toggleVisibility } =
    passwordField;
  const disabled = Boolean(disabledProp ?? field?.disabled);
  if (!mounted) return null;

  const label = passwordVisible ? hideLabel : showLabel;

  return (
    <>
      <Button
        {...props}
        as={as}
        disabled={disabled}
        aria-label={label}
        aria-controls={props["aria-controls"] ?? inputRef.current?.id}
        data-visible={dataAttr(passwordVisible)}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          onPointerDown?.(event);
          if (!event.defaultPrevented) captureSelection();
        }}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          toggleVisibility();
        }}
      >
        {children ?? label}
      </Button>
      <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
    </>
  );
}
