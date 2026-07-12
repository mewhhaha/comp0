import { useControllableState } from "@comp0/core";
import { SearchFieldContext, type RefProp } from "../shared.js";
import { TextField } from "./TextField.js";
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
  const [searchValue, setSearchValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const clear = () => {
    setSearchValue("");
    onClear?.();
  };
  const submit = (value = searchValue) => {
    onSubmit?.(value);
  };
  const context = {
    value: searchValue,
    disabled: Boolean(props.disabled),
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
