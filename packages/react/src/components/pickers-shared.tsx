import {
  createContext,
  Fragment,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type PickerOptionRecord = {
  value: string;
  id: string;
  text: string;
  disabled: boolean;
  element: HTMLElement | null;
};
export type PickerCollectionContextValue = {
  register: (option: PickerOptionRecord) => void;
  unregister: (value: string) => void;
};
export const SelectCollectionContext = createContext<PickerCollectionContextValue | null>(null);
export const ComboboxCollectionContext = createContext<PickerCollectionContextValue | null>(null);

export type SelectProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected option value; native input change events stay on leaf controls. */
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

export type ComboboxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  /** The committed logical option value. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the committed logical option value rather than a native ChangeEvent. */
  onChange?: (value: string) => void;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  /** Receives editable text; ComboboxInput.onChange still receives the native ChangeEvent. */
  onInputChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  allowsEmptyCollection?: boolean | undefined;
};

export const defaultFilter = (textValue: string, inputValue: string) =>
  textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());
