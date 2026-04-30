import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type ComboboxOptionProps } from "./pickers-shared.js";
export type { ComboboxOptionProps } from "./pickers-shared.js";
export function ComboboxOption({
  value,
  label,
  disabled,
  ref,
  ...props
}: ComboboxOptionProps & RefProp<HTMLOptionElement>) {
  const optionDisabled = Boolean(disabled);

  return (
    <option
      {...props}
      ref={ref}
      value={value}
      label={label}
      disabled={optionDisabled}
      data-disabled={dataAttr(optionDisabled)}
      data-label={label}
      data-value={value}
    />
  );
}
