import { useControllableState } from "@comp0/core";
import { useRef } from "react";
import { TextField, type TextFieldOwnProps } from "../text-field/TextField.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { type RootProps } from "../internal/polymorphic.js";
import { SearchFieldContext } from "./search-field-shared.js";

export type SearchFieldProps = RootProps<
  TextFieldOwnProps & {
    onSubmit?: ((value: string) => void) | undefined;
    onClear?: (() => void) | undefined;
  }
>;

export function SearchField({
  children,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  ...props
}: SearchFieldProps) {
  const autocomplete = useAutocompleteContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearch, searchState] = useControllableState({
    value: value ?? autocomplete?.inputValue,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const clear = () => {
    setSearch("");
    autocomplete?.setInputValue("", "deleteContentBackward");
    onClear?.();
  };
  const submit = (value = searchValue) => {
    onSubmit?.(value);
  };
  const context = {
    value: searchValue,
    disabled: Boolean(props.disabled),
    inputRef,
    clear,
    valueState: searchState,
    submit,
    setValue: setSearch,
  };

  return (
    <SearchFieldContext value={context}>
      <TextField {...props} value={searchValue} onChange={setSearch} data-search="">
        {children}
      </TextField>
    </SearchFieldContext>
  );
}
