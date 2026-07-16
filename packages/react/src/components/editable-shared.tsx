import { createContext, useContext, type RefObject } from "react";

export type EditableContextValue = {
  value: string;
  draft: string;
  editing: boolean;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  viewRef: RefObject<HTMLButtonElement | null>;
  setDraft: (draft: string) => void;
  startEditing: () => void;
  commit: (draft: string) => void;
  cancel: () => void;
};

export const EditableContext = createContext<EditableContextValue | null>(null);

export function useEditableContext(part: string) {
  const context = useContext(EditableContext);
  if (!context) throw new Error(`${part} must be rendered inside Editable.`);
  return context;
}
