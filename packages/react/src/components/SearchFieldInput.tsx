import { type KeyboardEvent } from "react";
import { useSearchFieldContext, type RefProp } from "../shared.js";
import { Input } from "./Input.js";
import { type SearchFieldInputProps } from "./text-field-shared.js";
export type { SearchFieldInputProps } from "./text-field-shared.js";

export function SearchFieldInput({
  onKeyDown,
  ref,
  ...props
}: SearchFieldInputProps & RefProp<HTMLInputElement>) {
  const searchField = useSearchFieldContext();

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !searchField) return;
    if (event.key === "Enter") searchField.submit(event.currentTarget.value);
    if (event.key === "Escape" && event.currentTarget.value) searchField.clear();
  }

  return <Input {...props} ref={ref} type="search" onKeyDown={handleKeyDown} />;
}
