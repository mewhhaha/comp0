import { createRequiredContext } from "../internal/context.js";

export type RadioGroupContextValue = {
  name: string;
  form?: string | undefined;
  value: string;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  onChange: (value: string) => void;
};

// A Radio also works on its own, so it reads the group optionally.
export const [RadioGroupContext, , useRadioGroupContext] =
  createRequiredContext<RadioGroupContextValue>("RadioGroup");
