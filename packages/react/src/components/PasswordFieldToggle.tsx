import { dataAttr } from "@comp0/core";
import {
  resolveChildren,
  resolveClassName,
  type RefProp,
  type StateChildren,
  type StateClassName,
} from "../shared.js";
import { Button, type ButtonProps, type ButtonState } from "./Button.js";
import { useFieldContext } from "./field-shared.js";
import { usePasswordFieldContext } from "./password-field-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type PasswordFieldToggleState = ButtonState & {
  passwordVisible: boolean;
};

export type PasswordFieldToggleProps = Omit<
  ButtonProps,
  "aria-label" | "aria-labelledby" | "aria-pressed" | "as" | "children" | "className" | "type"
> & {
  showLabel?: string | undefined;
  hideLabel?: string | undefined;
  children?: StateChildren<PasswordFieldToggleState>;
  className?: StateClassName<PasswordFieldToggleState>;
};

export function PasswordFieldToggle({
  children,
  className,
  disabled: disabledProp,
  showLabel = "Show password",
  hideLabel = "Hide password",
  onClick,
  onPointerDown,
  ref,
  ...props
}: PasswordFieldToggleProps & RefProp<HTMLButtonElement>) {
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
        as="button"
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-controls={props["aria-controls"] ?? inputRef.current?.id}
        data-visible={dataAttr(passwordVisible)}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!event.defaultPrevented) captureSelection();
        }}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          toggleVisibility();
        }}
        className={(state) => resolveClassName(className, { ...state, passwordVisible })}
      >
        {(state) => resolveChildren(children ?? label, { ...state, passwordVisible })}
      </Button>
      <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
    </>
  );
}
