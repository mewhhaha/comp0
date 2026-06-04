import { type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

export type TextFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "disabled" | "required"> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
};

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "disabled" | "required"
> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
};

export type SearchFieldProps = Omit<TextFieldProps, "onSubmit"> & {
  onSubmit?: ((value: string) => void) | undefined;
  onClear?: (() => void) | undefined;
};
