import { type InputHTMLAttributes } from "react";
import { dataAttr, mergeInteractionProps, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";

export type ColorFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "disabled" | "required"
> & {
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
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  ref,
  ...props
}: ColorFieldProps & RefProp<HTMLInputElement>) {
  const field = useFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  const inputValue = field?.value ?? props.value;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);

  return (
    <input
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={ref}
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
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented && field?.setValue) {
          field.setValue(event.currentTarget.value);
        }
      }}
    />
  );
}
