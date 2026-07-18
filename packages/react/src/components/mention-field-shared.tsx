import { createContext, useContext, type RefObject } from "react";

export type MentionMatch = {
  end: number;
  query: string;
  start: number;
  trigger: string;
};

export type MentionCaretRect = {
  bottom: number;
  left: number;
  top: number;
};

export type MentionFieldContextValue = {
  caretRect: MentionCaretRect | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  match: MentionMatch | null;
  dismiss: () => void;
  refreshCaretRect: () => MentionCaretRect | null;
  replaceMatch: (value: string) => void;
  restoreSelection: () => void;
  syncInput: (input: HTMLTextAreaElement, inputChanged?: boolean) => MentionMatch | null;
};

export type MentionFieldListBoxContextValue = {
  id: string;
  labelId?: string | undefined;
  select: (value: string) => void;
};

export const MentionFieldContext = createContext<MentionFieldContextValue | null>(null);
export const MentionFieldListBoxContext = createContext<MentionFieldListBoxContextValue | null>(
  null,
);

export function useMentionFieldContext() {
  return useContext(MentionFieldContext);
}

export function useMentionFieldListBoxContext() {
  return useContext(MentionFieldListBoxContext);
}
