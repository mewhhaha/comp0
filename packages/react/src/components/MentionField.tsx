import { useId, useRef, useState } from "react";
import { Autocomplete, type AutocompleteProps } from "./Autocomplete.js";
import {
  MentionFieldContext,
  type MentionCaretRect,
  type MentionMatch,
} from "./mention-field-shared.js";
import { PopoverContext, usePopoverState } from "./overlay-shared.js";
import { TextField, type TextFieldProps } from "./TextField.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";

const tokenCharacter = /[\p{L}\p{N}_.-]/u;
const tokenQuery = /^[\p{L}\p{N}_.-]*$/u;

function findMentionMatch(
  value: string,
  caret: number,
  triggers: readonly string[],
): MentionMatch | null {
  let match: MentionMatch | null = null;
  for (const trigger of triggers) {
    let start = value.lastIndexOf(trigger, caret - trigger.length);
    while (start >= 0) {
      const previous = value[start - 1];
      const queryStart = start + trigger.length;
      const query = value.slice(queryStart, caret);
      if ((!previous || !tokenCharacter.test(previous)) && tokenQuery.test(query)) {
        let end = caret;
        while (end < value.length && tokenCharacter.test(value[end]!)) end += 1;
        const candidate = { end, query, start, trigger };
        if (!match || candidate.start > match.start) match = candidate;
        break;
      }
      start = value.lastIndexOf(trigger, start - 1);
    }
  }
  return match;
}

const mirroredProperties = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "tabSize",
  "textAlign",
  "textIndent",
  "textTransform",
  "wordBreak",
  "wordSpacing",
] as const;

function measureCaret(input: HTMLTextAreaElement): MentionCaretRect {
  const document = input.ownerDocument;
  const window = document.defaultView;
  const inputRect = input.getBoundingClientRect();
  if (!window || !document.body) {
    return { bottom: inputRect.bottom, left: inputRect.left, top: inputRect.top };
  }

  const computed = window.getComputedStyle(input);
  const mirror = document.createElement("div");
  mirror.style.position = "fixed";
  mirror.style.left = `${inputRect.left}px`;
  mirror.style.top = `${inputRect.top - input.scrollTop}px`;
  mirror.style.width = `${input.offsetWidth}px`;
  mirror.style.overflow = "hidden";
  mirror.style.overflowWrap = "break-word";
  mirror.style.pointerEvents = "none";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  for (const property of mirroredProperties) mirror.style[property] = computed[property];

  mirror.textContent = input.value.slice(0, input.selectionStart);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.append(marker);
  document.body.append(mirror);
  const markerRect = marker.getBoundingClientRect();
  mirror.remove();

  return {
    bottom: markerRect.bottom,
    left: markerRect.left - input.scrollLeft,
    top: markerRect.top,
  };
}

export type MentionFieldProps = TextFieldProps & {
  filter?: AutocompleteProps["filter"];
  /** Characters that begin a completion token. Each trigger must be non-empty and contain no whitespace. */
  triggers?: readonly string[] | undefined;
};

export function MentionField({
  children,
  defaultValue,
  filter,
  onChange,
  triggers = ["@"],
  value,
  ...props
}: MentionFieldProps) {
  for (const trigger of triggers) {
    if (!trigger || /\s/u.test(trigger)) {
      throw new Error(
        `MentionField trigger ${JSON.stringify(trigger)} must be non-empty and contain no whitespace.`,
      );
    }
  }

  const id = useId().replace(/:/g, "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dismissedSelection = useRef("");
  const pendingCaret = useRef<number | null>(null);
  const replacing = useRef(false);
  const [match, setMatch] = useState<MentionMatch | null>(null);
  const [caretRect, setCaretRect] = useState<MentionCaretRect | null>(null);
  const fieldState = useFormControlState({ value, defaultValue: defaultValue ?? "", onChange });
  useFormReset({
    controlRef: inputRef,
    controlled: fieldState.controlled,
    resetValue: fieldState.resetValue,
    restoreValue: fieldState.restoreValue,
    readValue: (input) => input.value,
  });
  const popover = usePopoverState({
    open: match !== null,
    onToggle(open) {
      if (!open) setMatch(null);
    },
    triggerId: `mention-field-${id}-input`,
    contentId: `mention-field-${id}-listbox`,
  });

  const refreshCaretRect = () => {
    const input = inputRef.current;
    if (!input) return null;
    const nextRect = measureCaret(input);
    setCaretRect((current) => {
      if (
        current?.bottom === nextRect.bottom &&
        current.left === nextRect.left &&
        current.top === nextRect.top
      ) {
        return current;
      }
      return nextRect;
    });
    return nextRect;
  };

  const selectionKey = (input: HTMLTextAreaElement) =>
    `${input.value}\u0000${input.selectionStart}\u0000${input.selectionEnd}`;

  const syncInput = (input: HTMLTextAreaElement, inputChanged = false) => {
    const key = selectionKey(input);
    if (replacing.current || (!inputChanged && dismissedSelection.current === key)) return null;
    dismissedSelection.current = "";
    const nextMatch = findMentionMatch(input.value, input.selectionStart, triggers);
    setMatch(nextMatch);
    if (nextMatch) {
      const nextRect = measureCaret(input);
      setCaretRect(nextRect);
    } else {
      setCaretRect(null);
    }
    return nextMatch;
  };

  const replaceMatch = (selectedValue: string) => {
    const input = inputRef.current;
    if (!input || !match) return;
    const currentMatch = findMentionMatch(input.value, input.selectionStart, triggers);
    if (!currentMatch) return;
    const followingCharacter = input.value[currentMatch.end];
    const separator = followingCharacter ? "" : " ";
    const replacement = `${currentMatch.trigger}${selectedValue}${separator}`;
    const nextValue = `${input.value.slice(0, currentMatch.start)}${replacement}${input.value.slice(currentMatch.end)}`;
    pendingCaret.current = currentMatch.start + replacement.length;
    replacing.current = true;
    setMatch(null);
    setCaretRect(null);

    fieldState.setValue(nextValue);
  };

  const context = {
    caretRect,
    inputRef,
    match,
    dismiss() {
      const input = inputRef.current;
      dismissedSelection.current = input ? selectionKey(input) : "";
      setMatch(null);
      setCaretRect(null);
    },
    refreshCaretRect,
    replaceMatch,
    restoreSelection() {
      const input = inputRef.current;
      const caret = pendingCaret.current;
      if (!input || caret === null || caret > input.value.length) return;
      input.setSelectionRange(caret, caret);
      input.focus();
      pendingCaret.current = null;
      replacing.current = false;
      dismissedSelection.current = selectionKey(input);
    },
    syncInput,
  };

  return (
    <Autocomplete filter={filter} inputValue={match?.query ?? ""}>
      <PopoverContext value={popover}>
        <MentionFieldContext value={context}>
          <TextField
            {...props}
            value={fieldState.value}
            onChange={fieldState.setValue}
            data-mention-field=""
          >
            {children}
          </TextField>
        </MentionFieldContext>
      </PopoverContext>
    </Autocomplete>
  );
}
