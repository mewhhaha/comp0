import { type InputHTMLAttributes } from "react";
import { dataAttr, mergeInteractionProps, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { useDatePickerContext } from "./date-shared.js";

export type DateFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "disabled" | "max" | "min" | "required" | "type"
> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  /** Earliest selectable date as "YYYY-MM-DD". */
  min?: string | undefined;
  /** Latest selectable date as "YYYY-MM-DD". */
  max?: string | undefined;
};

export function DateField({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: DateFieldProps & RefProp<HTMLInputElement>) {
  const field = useFieldContext();
  const picker = useDatePickerContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  let inputValue = field?.value ?? props.value;
  if (picker) inputValue = picker.value;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);

  return (
    <input
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={ref}
      type="date"
      id={id ?? field?.controlId}
      value={inputValue}
      disabled={disabled}
      required={required}
      aria-describedby={description || undefined}
      aria-invalid={invalid}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(Boolean(invalid))}
      data-required={dataAttr(required)}
      data-value={typeof inputValue === "string" ? inputValue || undefined : undefined}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        picker?.setValue(event.currentTarget.value);
        field?.setValue?.(event.currentTarget.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
      }}
    />
  );
}
