import { type RefProp } from "../shared.js";
import { useContext, useId, useRef } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
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
  const checked = checkedState.value;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLLabelElement>({ disabled });
  const state = {
    checked,
    disabled,
    focused: isFocused,
    focusVisible: isFocusVisible,
    hovered: isHovered,
  };
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
      {...mergeProps(props, hoverProps)}
      ref={ref}
      data-checked={dataAttr(checked)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
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
        checked={checked}
        disabled={disabled}
        required={inputProps?.required ?? group?.required}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          focusProps.onBlur?.(event);
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
          focusProps.onFocus?.(event);
        }}
      />
      {typeof children === "function" ? children(state) : children}
    </label>
  );
}
