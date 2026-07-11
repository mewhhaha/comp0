import { useCallback, useMemo } from "react";
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
  const clear = useCallback(() => {
    setSearchValue("");
    onClear?.();
  }, [onClear, setSearchValue]);
  const submit = useCallback(
    (value = searchValue) => {
      onSubmit?.(value);
    },
    [onSubmit, searchValue],
  );
  const context = useMemo(
    () => ({
      value: searchValue,
      disabled: Boolean(props.disabled),
      clear,
      submit,
      setValue: setSearchValue,
    }),
    [clear, props.disabled, searchValue, setSearchValue, submit],
  );

  return (
    <SearchFieldContext.Provider value={context}>
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
    </SearchFieldContext.Provider>
  );
}
