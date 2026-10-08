import { type ChangeEvent, type ComponentProps } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useOptionalDatePickerContext } from "../internal/date-shared.js";

export type DateFieldProps = Omit<
  ComponentProps<"input">,
  "disabled" | "max" | "min" | "required" | "type"
> &
  AsProp & {
    disabled?: boolean | undefined;
    required?: boolean | undefined;
    /** Earliest selectable date as "YYYY-MM-DD". */
    min?: string | undefined;
    /** Latest selectable date as "YYYY-MM-DD". */
    max?: string | undefined;
  };

export function DateField({
  as,
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  ...props
}: DateFieldProps) {
  const field = useFieldContext();
  const picker = useOptionalDatePickerContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  let inputValue = field?.value ?? props.value;
  if (picker) inputValue = picker.value;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);

  const Part = partElement(as, "input");
  return (
    <Part
      {...mergeProps(props, focusProps, hoverProps)}
      type="date"
      id={id ?? field?.controlId}
      value={inputValue}
      disabled={disabled}
      required={required}
      aria-describedby={description || undefined}
      aria-invalid={invalid}
      data-slot={dataSlot(props, "date-field")}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(Boolean(invalid))}
      data-required={dataAttr(required)}
      data-value={typeof inputValue === "string" ? inputValue || undefined : undefined}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        picker?.setValue(event.currentTarget.value);
        field?.setValue?.(event.currentTarget.value);
      }}
    />
  );
}
