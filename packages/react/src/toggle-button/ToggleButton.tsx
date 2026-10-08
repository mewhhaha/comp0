import { dataAttr, useControllableState } from "@comp0/core";
import { Button, type ButtonProps } from "../button/Button.js";
import { useToggleButtonGroupContext } from "./toggle-button-shared.js";

export type ToggleButtonProps = Omit<ButtonProps, "onChange" | "value"> & {
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
  /** Receives the next on state rather than a DOM ChangeEvent. */
  onChange?: ((selected: boolean) => void) | undefined;
  /** Identifies the button inside a ToggleButtonGroup that manages selection. */
  value?: string | undefined;
};

export function ToggleButton({
  selected: selectedProp,
  defaultSelected = false,
  onChange,
  onClick,
  value,
  ...props
}: ToggleButtonProps) {
  const group = useToggleButtonGroupContext();
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
    />
  );
}
