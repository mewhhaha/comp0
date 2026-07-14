import {
  createContext,
  type CSSProperties,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";

export const visuallyHiddenInputStyle: CSSProperties = {
  border: 0,
  clipPath: "inset(50%)",
  height: 1,
  margin: 0,
  opacity: 0,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

export interface CheckboxGroupContextValue {
  name?: string | undefined;
  form?: string | undefined;
  value: string[];
  disabled?: boolean | undefined;
  onChange: (value: string, selected: boolean) => void;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export type CheckboxGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  /** Receives the next selected-value array rather than a native ChangeEvent. */
  onChange?: (value: string[]) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type CheckboxProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange" | "children"> & {
  name?: string | undefined;
  value?: string | undefined;
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  indeterminate?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange?: (selected: boolean) => void;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "defaultChecked" | "disabled"
  >;
  children?: ReactNode | ((state: ChoiceState) => ReactNode);
};

export interface ChoiceState {
  selected: boolean;
  disabled: boolean;
  indeterminate: boolean;
  focused: boolean;
}

export interface RadioGroupContextValue {
  name: string;
  form?: string | undefined;
  value: string;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  onChange: (value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next selected radio value rather than a native ChangeEvent. */
  onChange?: (value: string) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type RadioProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange" | "children"> & {
  name?: string | undefined;
  value: string;
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange?: ((selected: boolean) => void) | undefined;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "defaultChecked" | "disabled" | "name" | "value"
  >;
  children?: ReactNode | ((state: Omit<ChoiceState, "indeterminate">) => ReactNode);
};

// A switch is on or off; the checkbox mixed state has no valid switch ARIA.
export type SwitchProps = Omit<CheckboxProps, "indeterminate">;
