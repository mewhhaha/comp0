import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover, useControllableState } from "@comp0/core";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";
import {
  synchronizeStandaloneRadioGroup,
  useFormReset,
  useStandaloneRadioSynchronization,
} from "../internal/form-control-state.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useRadioGroupContext } from "./radio-shared.js";

export type RadioProps = Omit<ComponentProps<"label">, "onChange" | "children"> &
  AsProp & {
    name?: string | undefined;
    value: string;
    checked?: boolean | undefined;
    defaultChecked?: boolean | undefined;
    disabled?: boolean | undefined;
    onChange?: ((checked: boolean) => void) | undefined;
    inputProps?:
      | Omit<
          ComponentProps<"input">,
          "type" | "checked" | "defaultChecked" | "disabled" | "name" | "value"
        >
      | undefined;
    children?: ReactNode | undefined;
  };

export function Radio({
  as,
  children,
  name,
  value,
  checked: checkedProp,
  defaultChecked = false,
  disabled: disabledProp,
  onChange,
  inputProps,
  ...props
}: RadioProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const group = useRadioGroupContext();
  const selectedFromGroup = group ? group.value === value : undefined;
  const [checked, setChecked, checkedState] = useControllableState({
    value: checkedProp ?? selectedFromGroup,
    defaultValue: defaultChecked,
    onChange,
  });
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLLabelElement>({ disabled });
  useFormReset({
    controlRef: inputRef,
    form: inputProps?.form ?? group?.form,
    state: checkedState,
    readValue: (element) => element.checked,
  });
  useStandaloneRadioSynchronization({
    inputRef,
    state: checkedState,
    enabled: !group,
  });

  const Part = partElement(as, "label");
  return (
    <Part
      {...mergeProps(props, hoverProps)}
      data-checked={dataAttr(checked)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
    >
      <>
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
            setChecked(event.currentTarget.checked);
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
        {children}
      </>
    </Part>
  );
}
