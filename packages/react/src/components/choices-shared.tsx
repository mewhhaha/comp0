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
  onChange?: (value: string[]) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type CheckboxProps = Omit<
  LabelHTMLAttributes<HTMLLabelElement>,
  "onChange" | "children" | "defaultChecked"
> & {
  name?: string | undefined;
  value?: string | undefined;
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
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
  value: string;
  disabled?: boolean | undefined;
  onChange: (value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type RadioProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange" | "children"> & {
  value: string;
  disabled?: boolean | undefined;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "disabled" | "name" | "value"
  >;
  children?: ReactNode | ((state: Omit<ChoiceState, "indeterminate">) => ReactNode);
};

export type SwitchProps = CheckboxProps;
