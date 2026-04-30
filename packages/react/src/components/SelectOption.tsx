import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type SelectOptionProps } from "./pickers-shared.js";
export type { SelectOptionProps } from "./pickers-shared.js";
export function SelectOption({
  value,
  label,
  disabled,
  ref,
  ...props
}: SelectOptionProps & RefProp<HTMLOptionElement>) {
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
