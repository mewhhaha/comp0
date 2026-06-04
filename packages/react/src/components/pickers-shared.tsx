import { type HTMLAttributes, type OptionHTMLAttributes, type ReactNode } from "react";

export type SelectProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
};

export type SelectValueProps = HTMLAttributes<HTMLSpanElement> & {
  value?: ReactNode;
  placeholder?: ReactNode;
};

export type SelectOptionProps = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "disabled" | "value"
> & {
  value: string;
  label?: string | undefined;
  disabled?: boolean | undefined;
};

export type ComboboxOptionProps = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "disabled" | "value"
> & {
  value: string;
  label?: string | undefined;
  disabled?: boolean | undefined;
};

export type ComboboxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  selectedValue?: string | undefined;
  defaultSelectedValue?: string | undefined;
  onSelectedValueChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
};
