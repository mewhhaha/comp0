import { useRef, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { Input, type InputProps } from "../text-field/Input.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useFormReset } from "../internal/form-control-state.js";
import { useSearchFieldContext } from "./search-field-shared.js";

export type SearchFieldInputProps = Omit<InputProps, "type">;

export function SearchFieldInput({ onKeyDown, ref, ...props }: SearchFieldInputProps) {
  const autocomplete = useAutocompleteContext();
  const searchField = useSearchFieldContext();
  const inputRef = useRef<HTMLInputElement>(null);
  useFormReset({
    controlRef: inputRef,
    form: props.form,
    state: searchField?.valueState,
    readValue: (element) => element.value,
  });

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    autocomplete?.handleInputKeyDown(event);
    if (event.defaultPrevented || !searchField) return;
    if (event.key === "Enter") searchField.submit(event.currentTarget.value);
    if (event.key === "Escape" && event.currentTarget.value) {
      // Consumed so the same press does not also dismiss an enclosing layer.
      event.preventDefault();
      searchField.clear();
    }
  }

  return (
    <Input
      {...props}
      ref={composeRefs(ref, searchField?.inputRef, inputRef)}
      type="search"
      onKeyDown={handleKeyDown}
    />
  );
}
