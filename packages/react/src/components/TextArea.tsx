import { dataAttr, mergeInteractionProps, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { type TextAreaProps } from "./text-field-shared.js";
export type { TextAreaProps } from "./text-field-shared.js";
export function TextArea({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: TextAreaProps & RefProp<HTMLTextAreaElement>) {
  const field = useFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLTextAreaElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLTextAreaElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);

  return (
    <textarea
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={ref}
      id={id ?? field?.controlId}
      disabled={disabled}
      required={required}
      aria-describedby={description || undefined}
      aria-invalid={field?.invalid || undefined}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(field?.invalid)}
      data-required={dataAttr(required)}
    />
  );
}
