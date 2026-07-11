import {
  type ButtonHTMLAttributes,
  type ElementType,
  Fragment,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export type TextFieldProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next field value, rather than a native ChangeEvent from the provider root. */
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

export type SearchFieldInputProps = Omit<InputProps, "type">;

export type SearchFieldClearProps = ButtonHTMLAttributes<HTMLButtonElement>;
