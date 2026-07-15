import { createContext, useContext, type RefObject } from "react";

export type TagPickerState = {
  value: string[];
  inputValue: string;
  add: (value: string) => void;
  remove: (value: string) => void;
};

export type TagPickerContextValue = TagPickerState & {
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  addOption: (value: string, label: string) => void;
  registerOptionLabel: (value: string, label: string) => void;
};

export const TagPickerContext = createContext<TagPickerContextValue | null>(null);

export function useTagPickerContext(component: string) {
  const context = useContext(TagPickerContext);
  if (!context) throw new Error(`${component} must be rendered inside TagPicker.`);
  return context;
}
