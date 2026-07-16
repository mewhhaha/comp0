import { useContext, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { resolveChildren, resolveClassName, type RefProp } from "../shared.js";
import { Button, type ButtonProps, type ButtonState } from "./Button.js";
import { ToggleButtonGroupContext } from "./toggle-button-shared.js";

export type ToggleButtonState = ButtonState & {
  selected: boolean;
};

export type ToggleButtonProps = Omit<
  ButtonProps,
  "onChange" | "children" | "className" | "value"
> & {
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
  /** Receives the next on state rather than a DOM ChangeEvent. */
  onChange?: ((selected: boolean) => void) | undefined;
  /** Identifies the button inside a ToggleButtonGroup that manages selection. */
  value?: string | undefined;
  children?: ButtonProps["children"] | ((state: ToggleButtonState) => ReactNode);
  className?: string | ((state: ToggleButtonState) => string | undefined);
};

export function ToggleButton({
  selected: selectedProp,
  defaultSelected = false,
  onChange,
  onClick,
  value,
  children,
  className,
  ref,
  ...props
}: ToggleButtonProps & RefProp<HTMLButtonElement>) {
  const group = useContext(ToggleButtonGroupContext);
  const [standaloneSelected, setStandaloneSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange,
  });
  let selected = standaloneSelected;
  if (group && value !== undefined) selected = group.isSelected(value);

  return (
    <Button
      {...props}
      ref={ref}
      value={value}
      aria-pressed={selected}
      data-selected={dataAttr(selected)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (group && value !== undefined) {
          group.toggle(value);
          onChange?.(!selected);
          return;
        }
        setStandaloneSelected((current) => !current);
      }}
      className={(state) => resolveClassName(className, { ...state, selected })}
    >
      {(state) => resolveChildren(children, { ...state, selected })}
    </Button>
  );
}
