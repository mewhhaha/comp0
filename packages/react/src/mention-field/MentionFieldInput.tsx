import { composeRefs, dataAttr } from "@comp0/core";
import { useLayoutEffect } from "react";
import { TextArea, type TextAreaProps } from "../text-area/TextArea.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useRequiredMentionFieldContext } from "./mention-field-shared.js";

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
}: MentionFieldInputProps) {
  const autocomplete = useAutocompleteContext();
  const mentionField = useRequiredMentionFieldContext("MentionFieldInput");

  useLayoutEffect(() => mentionField.restoreSelection());

  const syncSelection = (input: HTMLTextAreaElement) => {
    const match = mentionField.syncInput(input);
    const query = match?.query ?? "";
    if (autocomplete?.inputValue !== query) autocomplete?.setInputValue(query);
  };

  return (
    <TextArea
      {...props}
      ref={composeRefs(ref, mentionField.inputRef)}
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
