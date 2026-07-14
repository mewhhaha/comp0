import { useRef, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { useSearchFieldContext, type RefProp } from "../shared.js";
import { Input } from "./Input.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { type SearchFieldInputProps } from "./text-field-shared.js";
import { useFormReset } from "./form-control-state.js";
export type { SearchFieldInputProps } from "./text-field-shared.js";

export function SearchFieldInput({
  onKeyDown,
  ref,
  ...props
}: SearchFieldInputProps & RefProp<HTMLInputElement>) {
  const autocomplete = useAutocompleteContext();
  const searchField = useSearchFieldContext();
  const inputRef = useRef<HTMLInputElement>(null);
  useFormReset({
    controlRef: inputRef,
    controlled: searchField?.controlled ?? true,
    form: props.form,
    resetValue: searchField?.resetValue ?? (() => undefined),
    restoreValue: searchField?.restoreValue ?? (() => undefined),
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
