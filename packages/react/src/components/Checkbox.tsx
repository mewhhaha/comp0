import { type RefProp } from "../shared.js";
import { useState, useContext, useId, useRef } from "react";
import { dataAttr, useControllableState, useIsoLayoutEffect } from "@comp0/core";
import { visuallyHiddenInputStyle, CheckboxGroupContext } from "./choices-shared.js";
import { type CheckboxProps, type ChoiceState } from "./choices-shared.js";
export type { CheckboxProps } from "./choices-shared.js";
export function Checkbox({
  children,
  name,
  value = "on",
  selected: selectedProp,
  defaultSelected = false,
  indeterminate,
  disabled: disabledProp,
  onChange,
  inputProps,
  ref,
  ...props
}: CheckboxProps & RefProp<HTMLLabelElement>) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const group = useContext(CheckboxGroupContext);
  const selectedFromGroup = group ? group.value.includes(value) : undefined;
  const [selected, setSelected] = useControllableState({
    value: selectedProp ?? selectedFromGroup,
    defaultValue: defaultSelected,
    onChange,
  });
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const resolvedIndeterminate = Boolean(indeterminate);
  const [focused, setFocused] = useState(false);
  const state: ChoiceState = {
    selected,
    disabled,
    indeterminate: resolvedIndeterminate,
    focused,
  };

  useIsoLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = resolvedIndeterminate;
  }, [resolvedIndeterminate]);

  return (
    <label
      {...props}
      ref={ref}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(focused)}
      data-indeterminate={dataAttr(resolvedIndeterminate)}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="checkbox"
        name={name ?? group?.name}
        value={value}
        checked={selected}
        disabled={disabled}
        aria-checked={resolvedIndeterminate ? "mixed" : selected}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          setFocused(false);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (event.defaultPrevented) return;
          setSelected(event.currentTarget.checked);
          group?.onChange(value, event.currentTarget.checked);
        }}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          setFocused(true);
        }}
      />
      {typeof children === "function" ? children(state) : children}
    </label>
  );
}
