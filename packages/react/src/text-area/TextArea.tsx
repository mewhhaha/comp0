import { useComposedRefs, dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import { useRef, type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useMentionFieldContext } from "../mention-field/mention-field-shared.js";
import { useFormReset } from "../internal/form-control-state.js";

export type TextAreaProps = ComponentProps<"textarea"> & AsProp;

export function TextArea({
  as,
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: TextAreaProps) {
  const autocomplete = useAutocompleteContext();
  const mentionField = useMentionFieldContext();
  const field = useFieldContext();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLTextAreaElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLTextAreaElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  const textValue = field?.value ?? props.value ?? autocomplete?.inputValue;
  const invalid = props["aria-invalid"] ?? (field?.invalid || undefined);
  useFormReset({
    controlRef: textAreaRef,
    form: props.form,
    state: field?.valueState,
    readValue: (element) => element.value,
  });

  const composedRef = useComposedRefs(ref, autocomplete?.inputRef, textAreaRef);
  const Part = partElement(as, "textarea");
  return (
    <Part
      {...mergeProps(props, focusProps, hoverProps)}
      ref={composedRef}
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
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        field?.setValue?.(event.currentTarget.value);
        const nativeEvent = event.nativeEvent as InputEvent;
        const mention = mentionField?.syncInput(event.currentTarget, true);
        const autocompleteValue = mentionField ? (mention?.query ?? "") : event.currentTarget.value;
        autocomplete?.setInputValue(autocompleteValue, nativeEvent.inputType);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) autocomplete?.handleInputKeyDown(event);
      }}
    />
  );
}
