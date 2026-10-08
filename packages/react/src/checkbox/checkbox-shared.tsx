import { createRequiredContext } from "../internal/context.js";

export type CheckboxGroupContextValue = {
  name?: string | undefined;
  form?: string | undefined;
  value: string[];
  disabled?: boolean | undefined;
  onChange: (value: string, checked: boolean) => void;
};

// A Checkbox also works on its own, so it reads the group optionally.
export const [CheckboxGroupContext, , useCheckboxGroupContext] =
  createRequiredContext<CheckboxGroupContextValue>("CheckboxGroup");
