import { useId, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover, useControllableState } from "@comp0/core";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";
import { useFormReset } from "../internal/form-control-state.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCheckboxGroupContext } from "./checkbox-shared.js";

export type CheckboxProps = Omit<ComponentProps<"label">, "onChange" | "children"> &
  AsProp & {
    name?: string | undefined;
    value?: string | undefined;
    checked?: boolean | undefined;
    defaultChecked?: boolean | undefined;
    indeterminate?: boolean | undefined;
    disabled?: boolean | undefined;
    onChange?: ((checked: boolean) => void) | undefined;
    inputProps?:
      | Omit<ComponentProps<"input">, "type" | "checked" | "defaultChecked" | "disabled">
      | undefined;
    children?: ReactNode | undefined;
  };

export function Checkbox({
  as,
  children,
  name,
  value = "on",
  checked: checkedProp,
  defaultChecked = false,
  indeterminate,
  disabled: disabledProp,
  onChange,
  inputProps,
  ...props
}: CheckboxProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const group = useCheckboxGroupContext();
  const selectedFromGroup = group ? group.value.includes(value) : undefined;
  const [checked, setChecked, checkedState] = useControllableState({
    value: checkedProp ?? selectedFromGroup,
    defaultValue: defaultChecked,
    onChange,
  });
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const resolvedIndeterminate = Boolean(indeterminate);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLLabelElement>({ disabled });
  useFormReset({
    controlRef: inputRef,
    form: inputProps?.form ?? group?.form,
    state: checkedState,
    readValue: (element) => element.checked,
  });

  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = resolvedIndeterminate;
  }, [resolvedIndeterminate]);

  const collection = group?.collection;
  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!collection || !element) return;
    collection.register({ key: value, textValue: value, disabled, element });
    return () => {
      collection.unregister(value, element);
    };
  }, [collection, value, disabled]);

  const Part = partElement(as, "label");
  return (
    <Part
      {...mergeProps(props, hoverProps)}
      data-checked={dataAttr(checked)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-indeterminate={dataAttr(resolvedIndeterminate)}
    >
      <>
        <input
          {...inputProps}
          ref={inputRef}
          id={inputProps?.id ?? id}
          style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
          type="checkbox"
          form={inputProps?.form ?? group?.form}
          name={name ?? group?.name}
          value={value}
          checked={checked}
          disabled={disabled}
          aria-checked={resolvedIndeterminate ? "mixed" : checked}
          onBlur={(event) => {
            inputProps?.onBlur?.(event);
            focusProps.onBlur?.(event);
          }}
          onChange={(event) => {
            inputProps?.onChange?.(event);
            if (event.defaultPrevented) return;
            setChecked(event.currentTarget.checked);
            group?.onChange(value, event.currentTarget.checked);
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
