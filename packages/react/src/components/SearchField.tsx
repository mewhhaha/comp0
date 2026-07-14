import { useRef } from "react";
import { SearchFieldContext, type RefProp } from "../shared.js";
import { TextField } from "./TextField.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { type SearchFieldProps } from "./text-field-shared.js";
import { useFormControlState } from "./form-control-state.js";
export type { SearchFieldProps } from "./text-field-shared.js";
export function SearchField({
  as,
  children,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  ref,
  ...props
}: SearchFieldProps & RefProp<HTMLElement>) {
  const autocomplete = useAutocompleteContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchState = useFormControlState({
    value: value ?? autocomplete?.inputValue,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const searchValue = searchState.value;
  const setSearchValue = searchState.setValue;
  const clear = () => {
    setSearchValue("");
    autocomplete?.setInputValue("", "deleteContentBackward");
    onClear?.();
  };
  const submit = (value = searchValue) => {
    onSubmit?.(value);
  };
  const context = {
    value: searchValue,
    disabled: Boolean(props.disabled),
    controlled: searchState.controlled,
    inputRef,
    clear,
    resetValue: searchState.resetValue,
    restoreValue: searchState.restoreValue,
    submit,
    setValue: setSearchValue,
  };

  return (
    <SearchFieldContext value={context}>
      <TextField
        as={as}
        {...props}
        ref={ref}
        value={searchValue}
        onChange={setSearchValue}
        data-search=""
      >
        {children}
      </TextField>
    </SearchFieldContext>
  );
}
