import { type RefObject } from "react";
import { type ControllableStateControls } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type SearchFieldContextValue = {
  value: string;
  disabled: boolean;
  valueState: ControllableStateControls<string>;
  inputRef: RefObject<HTMLInputElement | null>;
  clear: () => void;
  submit: (value?: string) => void;
  setValue: (value: string) => void;
};

// SearchFieldInput and SearchFieldClear also work without a SearchField, so both read it optionally.
export const [SearchFieldContext, , useSearchFieldContext] =
  createRequiredContext<SearchFieldContextValue>("SearchField");
