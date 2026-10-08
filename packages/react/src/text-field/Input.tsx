import { useComposedRefs, dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { useRef, type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useFormReset } from "../internal/form-control-state.js";

export type InputProps = ComponentProps<"input"> & AsProp;

export function Input({
  as,
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: InputProps) {
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
    form: props.form,
    state: field?.valueState,
    readValue: (element) => element.value,
  });

  const composedRef = useComposedRefs(ref, autocomplete?.inputRef, inputRef);
  const Part = partElement(as, "input");
  return (
    <Part
      {...mergeProps(props, focusProps, hoverProps)}
      ref={composedRef}
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
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        field?.setValue?.(event.currentTarget.value);
        const nativeEvent = event.nativeEvent as InputEvent;
        autocomplete?.setInputValue(event.currentTarget.value, nativeEvent.inputType);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) autocomplete?.handleInputKeyDown(event);
      }}
    />
  );
}
