import { createElement, type ElementType, type HTMLAttributes } from "react";
import { useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  ToggleButtonGroupContext,
  type ToggleButtonGroupContextValue,
  type ToggleButtonGroupValue,
} from "./toggle-button-shared.js";
export type { ToggleButtonGroupValue } from "./toggle-button-shared.js";

function toValues(value: ToggleButtonGroupValue) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

type ToggleButtonGroupBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> & {
  as?: ElementType | undefined;
  "data-slot"?: string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
};

type SingleToggleButtonGroupProps = {
  type?: "single" | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next selection ("" when the group empties) rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
};

type MultipleToggleButtonGroupProps = {
  type: "multiple";
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
};

export type ToggleButtonGroupProps = ToggleButtonGroupBaseProps &
  (SingleToggleButtonGroupProps | MultipleToggleButtonGroupProps);

export function ToggleButtonGroup({
  as,
  orientation = "horizontal",
  type,
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: ToggleButtonGroupProps & RefProp<HTMLDivElement>) {
  const selectionEnabled =
    type !== undefined ||
    value !== undefined ||
    defaultValue !== undefined ||
    onChange !== undefined;
  const resolvedType = type ?? "single";
  const [selected, setSelected] = useControllableState<ToggleButtonGroupValue>({
    value,
    defaultValue: defaultValue ?? (resolvedType === "multiple" ? [] : ""),
    onChange: onChange as ((value: ToggleButtonGroupValue) => void) | undefined,
  });

  const isSelected = (buttonValue: string) => toValues(selected).includes(buttonValue);
  const toggle = (buttonValue: string) => {
    if (resolvedType === "multiple") {
      setSelected((current) => {
        const values = toValues(current);
        if (values.includes(buttonValue)) return values.filter((entry) => entry !== buttonValue);
        return [...values, buttonValue];
      });
      return;
    }
    setSelected((current) => (current === buttonValue ? "" : buttonValue));
  };

  let context: ToggleButtonGroupContextValue | null = null;
  if (selectionEnabled) context = { type: resolvedType, isSelected, toggle };

  return (
    <ToggleButtonGroupContext value={context}>
      {createElement(as ?? "div", {
        ...props,
        ref,
        role: props.role ?? "group",
        "data-orientation": orientation,
        "data-slot": props["data-slot"] ?? "toggle-button-group",
      })}
    </ToggleButtonGroupContext>
  );
}
