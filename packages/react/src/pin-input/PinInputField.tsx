import {
  useId,
  useLayoutEffect,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { useComposedRefs, dataAttr, useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { writingDirection } from "../internal/writing-direction.js";
import { acceptedCharacters, usePinInputContext } from "./pin-input-shared.js";

export type PinInputFieldProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "maxLength"
> &
  AsProp;

/**
 * One character of the code: a native single-character input. Give each
 * field its own aria-label such as "Digit 1". Typing fills and advances,
 * Backspace clears or moves back, arrows move, and pasting distributes the
 * clipboard code from this field on. The first field advertises
 * autocomplete="one-time-code" so the platform can offer the received code.
 */
export function PinInputField({
  as,
  autoComplete,
  inputMode,
  disabled,
  onKeyDown,
  onPaste,
  onFocus,
  ref,
  ...props
}: PinInputFieldProps) {
  const context = usePinInputContext("PinInputField");
  const key = useId();
  const navigate = useCollectionNavigation();
  const [element, setElement] = useState<HTMLInputElement | null>(null);
  const { collection } = context;
  const resolvedDisabled = context.disabled || Boolean(disabled);

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({ key, textValue: "", disabled: resolvedDisabled, element });
    return () => {
      collection.unregister(key, element);
    };
  }, [collection, element, key, resolvedDisabled]);

  const index = context.order.indexOf(key);
  const character = index >= 0 ? context.value.charAt(index) : "";
  let resolvedAutoComplete = autoComplete;
  if (resolvedAutoComplete === undefined && index === 0) resolvedAutoComplete = "one-time-code";
  let resolvedInputMode = inputMode;
  if (resolvedInputMode === undefined && context.type === "numeric") resolvedInputMode = "numeric";

  const composedRef = useComposedRefs(ref, setElement);
  const Part = partElement(as, "input");
  return (
    <Part
      {...props}
      ref={composedRef}
      type={context.mask ? "password" : "text"}
      value={character}
      maxLength={1}
      autoComplete={resolvedAutoComplete}
      inputMode={resolvedInputMode}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        if (index < 0) return;
        const raw = event.currentTarget.value;
        if (raw === "") {
          context.clearCharacter(index);
          return;
        }
        const typed = acceptedCharacters(raw[raw.length - 1] ?? "", context.type);
        // Rejected characters change nothing; React snaps the input back.
        if (!typed) return;
        context.setCharacter(index, typed);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled || index < 0) return;
        if (event.key === "Backspace") {
          event.preventDefault();
          if (character) context.clearCharacter(index);
          else context.focusField(index - 1);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const target = navigate(event.key, collection.items(), key, {
            orientation: "horizontal",
            dir: writingDirection(event.currentTarget),
            typeahead: false,
          });
          if (target) collection.get(target)?.element?.focus();
        }
      }}
      onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
        onPaste?.(event);
        if (event.defaultPrevented || resolvedDisabled || index < 0) return;
        event.preventDefault();
        const text = acceptedCharacters(event.clipboardData.getData("text"), context.type);
        if (!text) return;
        context.pasteCode(index, text);
      }}
      onFocus={(event: FocusEvent<HTMLInputElement>) => {
        onFocus?.(event);
        event.currentTarget.select();
      }}
    />
  );
}
