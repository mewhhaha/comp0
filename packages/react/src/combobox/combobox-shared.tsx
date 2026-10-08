import { type RefObject } from "react";
import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import { type PopoverContextValue } from "../internal/overlay/index.js";

export type ComboboxContextValue = {
  /** The option the input's aria-activedescendant points at; empty when none is active. */
  activeKey: string;
  disabled: boolean;
  invalid: boolean;
  required: boolean;
  displayValue: string;
  inputValue: string;
  selectedKey: string;
  inputId: string;
  listBoxId: string;
  labelId: string;
  descriptionId: string;
  form: string | undefined;
  inputRef: RefObject<HTMLInputElement | null>;
  /** The visible, mounted options. Filtered-out options are not registered. */
  collection: Collection;
  popover: PopoverContextValue;
  setActiveKey: (key: string) => void;
  setInputValue: (value: string) => void;
  setSelectedKey: (key: string) => void;
  isItemVisible: (textValue: string) => boolean;
};

export const [ComboboxContext, useComboboxContext] =
  createRequiredContext<ComboboxContextValue>("Combobox");
