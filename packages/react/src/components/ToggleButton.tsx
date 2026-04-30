import { type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { resolveChildren, resolveClassName, type RefProp } from "../shared.js";
import { Button, type ButtonProps, type ButtonState } from "./Button.js";

export type ToggleButtonState = ButtonState & {
  selected: boolean;
};

export type ToggleButtonProps = Omit<ButtonProps, "onChange" | "children" | "className"> & {
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
  onChange?: (selected: boolean) => void;
  children?: ButtonProps["children"] | ((state: ToggleButtonState) => ReactNode);
  className?: string | ((state: ToggleButtonState) => string | undefined);
};

export function ToggleButton({
  selected: selectedProp,
  defaultSelected = false,
  onChange,
  onClick,
  children,
  className,
  ref,
  ...props
}: ToggleButtonProps & RefProp<HTMLButtonElement>) {
  const [selected, setSelected] = useControllableState({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange,
  });

  return (
    <Button
      {...props}
      ref={ref}
      aria-pressed={selected}
      data-selected={dataAttr(selected)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setSelected((current) => !current);
      }}
      className={(state) => resolveClassName(className, { ...state, selected })}
    >
      {(state) => resolveChildren(children, { ...state, selected })}
    </Button>
  );
}
