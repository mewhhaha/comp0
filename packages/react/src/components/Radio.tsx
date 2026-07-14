import { type RefProp } from "../shared.js";
import { useState, useContext, useId, useRef } from "react";
import { dataAttr } from "@comp0/core";
import { visuallyHiddenInputStyle, RadioGroupContext } from "./choices-shared.js";
import { type RadioProps } from "./choices-shared.js";
import {
  synchronizeStandaloneRadioGroup,
  useFormControlState,
  useFormReset,
  useStandaloneRadioSynchronization,
} from "./form-control-state.js";
export type { RadioProps } from "./choices-shared.js";
export function Radio({
  children,
  name,
  value,
  checked: checkedProp,
  defaultChecked = false,
  disabled: disabledProp,
  onChange,
  inputProps,
  ref,
  ...props
}: RadioProps & RefProp<HTMLLabelElement>) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const group = useContext(RadioGroupContext);
  const selectedFromGroup = group ? group.value === value : undefined;
  const checkedState = useFormControlState({
    value: checkedProp ?? selectedFromGroup,
    defaultValue: defaultChecked,
    onChange,
  });
  const selected = checkedState.value;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const [focused, setFocused] = useState(false);
  const state = { selected, disabled, focused };
  useFormReset({
    controlRef: inputRef,
    controlled: checkedState.controlled,
    form: inputProps?.form ?? group?.form,
    resetValue: checkedState.resetValue,
    restoreValue: checkedState.restoreValue,
    readValue: (element) => element.checked,
  });
  useStandaloneRadioSynchronization({
    inputRef,
    controlled: checkedState.controlled,
    restoreValue: checkedState.restoreValue,
    enabled: !group,
  });

  return (
    <label
      {...props}
      ref={ref}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(focused)}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="radio"
        form={inputProps?.form ?? group?.form}
        name={name ?? group?.name}
        value={value}
        checked={selected}
        disabled={disabled}
        required={inputProps?.required ?? group?.required}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          setFocused(false);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (event.defaultPrevented) return;
          checkedState.setValue(event.currentTarget.checked);
          if (event.currentTarget.checked) group?.onChange(value);
          if (!group && event.currentTarget.checked) {
            synchronizeStandaloneRadioGroup(event.currentTarget);
          }
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
