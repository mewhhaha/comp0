import { useRef } from "react";
import { useControllableState } from "@comp0/core";
import { SearchFieldContext, type RefProp } from "../shared.js";
import { TextField } from "./TextField.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { type SearchFieldProps } from "./text-field-shared.js";
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
  const [searchValue, setSearchValue] = useControllableState({
    value: value ?? autocomplete?.inputValue,
    defaultValue: defaultValue ?? "",
    onChange,
  });
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
    inputRef,
    clear,
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
