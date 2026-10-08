import { type ChangeEvent, type ComponentProps } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ColorFieldProps = Omit<ComponentProps<"input">, "type" | "disabled" | "required"> &
  AsProp & {
    disabled?: boolean | undefined;
    required?: boolean | undefined;
  };

/**
 * Native color input that joins the surrounding field context: it takes the
 * field's control id, aria-describedby, disabled/invalid/required state, and
 * participates in the field's value. onChange keeps the native ChangeEvent
 * contract. Native color inputs hold an opaque hex sRGB value such as
 * "#0d9488" — no alpha channel and no wide-gamut colors.
 */
export function ColorField({
  as,
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  ...props
}: ColorFieldProps) {
  const field = useFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  const inputValue = field?.value ?? props.value;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);

  const Part = partElement(as, "input");
  return (
    <Part
      data-slot="color-field"
      {...mergeProps(props, focusProps, hoverProps)}
      type="color"
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
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        field?.setValue?.(event.currentTarget.value);
      }}
    />
  );
}
