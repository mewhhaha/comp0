import {
  composeRefs,
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useFocusRing,
  useHover,
} from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { type TextAreaProps } from "./text-field-shared.js";
export type { TextAreaProps } from "./text-field-shared.js";
export function TextArea({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: TextAreaProps & RefProp<HTMLTextAreaElement>) {
  const autocomplete = useAutocompleteContext();
  const field = useFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLTextAreaElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLTextAreaElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  const textValue = field?.value ?? props.value ?? autocomplete?.inputValue;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);

  return (
    <textarea
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={composeRefs(ref, autocomplete?.inputRef)}
      id={id ?? field?.controlId}
      value={textValue}
      disabled={disabled}
      required={required}
      aria-describedby={description || undefined}
      aria-invalid={invalid}
      aria-activedescendant={
        props["aria-activedescendant"] ??
        (!autocomplete?.disableVirtualFocus ? autocomplete?.activeId || undefined : undefined)
      }
      aria-autocomplete={props["aria-autocomplete"] ?? (autocomplete ? "list" : undefined)}
      aria-controls={props["aria-controls"] ?? autocomplete?.collectionId}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(Boolean(invalid))}
      data-required={dataAttr(required)}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        field?.setValue?.(event.currentTarget.value);
        const nativeEvent = event.nativeEvent as InputEvent;
        autocomplete?.setInputValue(event.currentTarget.value, nativeEvent.inputType);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) autocomplete?.handleInputKeyDown(event);
      }}
    />
  );
}
