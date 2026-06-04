import { useCallback, useMemo } from "react";
import { useControllableState } from "@comp0/core";
import { SearchFieldContext, type RefProp } from "../shared.js";
import { TextField } from "./TextField.js";
import { type SearchFieldProps } from "./text-field-shared.js";
export type { SearchFieldProps } from "./text-field-shared.js";
export function SearchField({
  children,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  ref,
  ...props
}: SearchFieldProps & RefProp<HTMLDivElement>) {
  const [searchValue, setSearchValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const controlsValue = value !== undefined || defaultValue !== undefined || onChange !== undefined;
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
      controlled: controlsValue,
      clear,
      submit,
      setValue: setSearchValue,
    }),
    [clear, controlsValue, props.disabled, searchValue, setSearchValue, submit],
  );

  return (
    <SearchFieldContext.Provider value={context}>
      <TextField
        {...props}
        ref={ref}
        {...(controlsValue ? { value: searchValue, onChange: setSearchValue } : {})}
        data-search=""
      >
        {children}
      </TextField>
    </SearchFieldContext.Provider>
  );
}
