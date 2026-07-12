import { type InputHTMLAttributes } from "react";
import { dataAttr, mergeInteractionProps, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";

export type TimeFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "disabled" | "max" | "min" | "required" | "type"
> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  /** Earliest selectable time as "HH:mm" (or "HH:mm:ss" with a sub-minute step). */
  min?: string | undefined;
  /** Latest selectable time as "HH:mm" (or "HH:mm:ss" with a sub-minute step). */
  max?: string | undefined;
  /** Native step granularity in seconds; 60 is the browser default, 1 reveals seconds. */
  step?: number | string | undefined;
};

export function TimeField({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: TimeFieldProps & RefProp<HTMLInputElement>) {
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
      type="time"
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
      onKeyDown={(event) => {
        onKeyDown?.(event);
      }}
    />
  );
}
