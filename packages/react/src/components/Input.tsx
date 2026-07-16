import {
  composeRefs,
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useFocusRing,
  useHover,
} from "@comp0/core";
import { useRef } from "react";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { type InputProps } from "./text-field-shared.js";
import { useFormReset } from "./form-control-state.js";
export type { InputProps } from "./text-field-shared.js";
const ignoreReset = () => undefined;
export function Input({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: InputProps & RefProp<HTMLInputElement>) {
  const autocomplete = useAutocompleteContext();
  const field = useFieldContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  const inputValue = field?.value ?? props.value ?? autocomplete?.inputValue;
  // Masked secrets must not be serialized into the DOM where extensions and
  // logging tools can read them.
  let mirroredValue: string | undefined;
  if (typeof inputValue === "string" && props.type !== "password") {
    mirroredValue = inputValue || undefined;
  }
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);
  useFormReset({
    controlRef: inputRef,
    controlled: field?.valueControlled ?? true,
    form: props.form,
    resetValue: field?.resetValue ?? ignoreReset,
    restoreValue: field?.restoreValue ?? ignoreReset,
    readValue: (element) => element.value,
  });

  return (
    <input
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={composeRefs(ref, autocomplete?.inputRef, inputRef)}
      id={id ?? field?.controlId}
      value={inputValue}
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
      data-value={mirroredValue}
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
