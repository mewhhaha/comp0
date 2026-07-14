import { type RefProp } from "../shared.js";
import { useState, useContext, useId, useRef } from "react";
import { dataAttr, useIsoLayoutEffect } from "@comp0/core";
import { visuallyHiddenInputStyle, CheckboxGroupContext } from "./choices-shared.js";
import { type CheckboxProps, type ChoiceState } from "./choices-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
export type { CheckboxProps } from "./choices-shared.js";
export function Checkbox({
  children,
  name,
  value = "on",
  checked: checkedProp,
  defaultChecked = false,
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
  const checkedState = useFormControlState({
    value: checkedProp ?? selectedFromGroup,
    defaultValue: defaultChecked,
    onChange,
  });
  const selected = checkedState.value;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const resolvedIndeterminate = Boolean(indeterminate);
  const [focused, setFocused] = useState(false);
  const state: ChoiceState = {
    selected,
    disabled,
    indeterminate: resolvedIndeterminate,
    focused,
  };
  useFormReset({
    controlRef: inputRef,
    controlled: checkedState.controlled,
    form: inputProps?.form ?? group?.form,
    resetValue: checkedState.resetValue,
    restoreValue: checkedState.restoreValue,
    readValue: (element) => element.checked,
  });

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
        data-checkbox-group-control={group ? "" : undefined}
        form={inputProps?.form ?? group?.form}
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
          checkedState.setValue(event.currentTarget.checked);
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
