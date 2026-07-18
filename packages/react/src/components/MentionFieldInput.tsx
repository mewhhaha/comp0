import { composeRefs, dataAttr } from "@comp0/core";
import { useLayoutEffect } from "react";
import { type RefProp } from "../shared.js";
import { TextArea, type TextAreaProps } from "./TextArea.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { useMentionFieldContext } from "./mention-field-shared.js";

export type MentionFieldInputProps = TextAreaProps;

export function MentionFieldInput({
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp,
  onScroll,
  onSelect,
  ref,
  ...props
}: MentionFieldInputProps & RefProp<HTMLTextAreaElement>) {
  const autocomplete = useAutocompleteContext();
  const mentionField = useMentionFieldContext();
  if (!mentionField) throw new Error("MentionFieldInput must be rendered inside MentionField.");

  useLayoutEffect(() => mentionField.restoreSelection());

  const syncSelection = (input: HTMLTextAreaElement) => {
    const match = mentionField.syncInput(input);
    autocomplete?.setInputValue(match?.query ?? "");
  };

  return (
    <TextArea
      {...props}
      ref={composeRefs(ref, mentionField.inputRef)}
      aria-expanded={props["aria-expanded"] ?? mentionField.match !== null}
      aria-haspopup={props["aria-haspopup"] ?? "listbox"}
      data-mention-active={dataAttr(mentionField.match !== null)}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) mentionField.dismiss();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) syncSelection(event.currentTarget);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape" || !mentionField.match) return;
        event.preventDefault();
        mentionField.dismiss();
        autocomplete?.clearActive();
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (
          !event.defaultPrevented &&
          ["ArrowLeft", "ArrowRight", "End", "Home"].includes(event.key)
        ) {
          syncSelection(event.currentTarget);
        }
      }}
      onScroll={(event) => {
        onScroll?.(event);
        if (!event.defaultPrevented && mentionField.match) mentionField.refreshCaretRect();
      }}
      onSelect={(event) => {
        onSelect?.(event);
        if (!event.defaultPrevented) syncSelection(event.currentTarget);
      }}
    />
  );
}
