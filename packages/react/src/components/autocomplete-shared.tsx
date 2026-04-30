import { type HTMLAttributes, type ReactNode } from "react";

export type AutocompleteProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  allowsEmptyCollection?: boolean | undefined;
  disabled?: boolean | undefined;
  children?: ReactNode;
};

export const defaultFilter = (textValue: string, inputValue: string) =>
  textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());
