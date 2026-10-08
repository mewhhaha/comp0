import { type RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";

export type EditableContextValue = {
  value: string;
  draft: string;
  open: boolean;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  viewRef: RefObject<HTMLButtonElement | null>;
  setDraft: (draft: string) => void;
  startEditing: () => void;
  commit: (draft: string) => void;
  cancel: () => void;
};

export const [EditableContext, useEditableContext] =
  createRequiredContext<EditableContextValue>("Editable");
