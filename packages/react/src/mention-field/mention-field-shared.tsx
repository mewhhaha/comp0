import { type RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";

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

// TextArea and ListBox also work outside a MentionField, so they read the
// optional hooks; the MentionField parts read the required ones.
export const [MentionFieldContext, useRequiredMentionFieldContext, useMentionFieldContext] =
  createRequiredContext<MentionFieldContextValue>("MentionField");
export const [MentionFieldListBoxContext, , useMentionFieldListBoxContext] =
  createRequiredContext<MentionFieldListBoxContextValue>("MentionFieldPopover");
