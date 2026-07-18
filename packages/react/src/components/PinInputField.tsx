import { useContext, useLayoutEffect, useState } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  acceptedCharacters,
  PinInputContext,
  type PinInputFieldProps,
} from "./pin-input-shared.js";
import { writingDirection } from "./writing-direction.js";
export type { PinInputFieldProps } from "./pin-input-shared.js";

/**
 * One character of the code: a native single-character input. Give each
 * field its own aria-label such as "Digit 1". Typing fills and advances,
 * Backspace clears or moves back, arrows move, and pasting distributes the
 * clipboard code from this field on. The first field advertises
 * autocomplete="one-time-code" so the platform can offer the received code.
 */
export function PinInputField({
  autoComplete,
  inputMode,
  disabled,
  onKeyDown,
  onPaste,
  onFocus,
  ref,
  ...props
}: PinInputFieldProps & RefProp<HTMLInputElement>) {
  const context = useContext(PinInputContext);
  const [element, setElement] = useState<HTMLInputElement | null>(null);
  if (!context) throw new Error("PinInputField must be rendered inside PinInput.");
  const { register } = context;

  useLayoutEffect(() => {
    if (!element) return;
    return register(element);
  }, [element, register]);

  const index = element ? context.fields.indexOf(element) : -1;
  const character = index >= 0 ? context.value.charAt(index) : "";
  const resolvedDisabled = context.disabled || Boolean(disabled);
  let resolvedAutoComplete = autoComplete;
  if (resolvedAutoComplete === undefined && index === 0) resolvedAutoComplete = "one-time-code";
  let resolvedInputMode = inputMode;
  if (resolvedInputMode === undefined && context.type === "numeric") resolvedInputMode = "numeric";

  return (
    <input
      {...props}
      ref={composeRefs(ref, setElement)}
      type={context.mask ? "password" : "text"}
      value={character}
      maxLength={1}
      autoComplete={resolvedAutoComplete}
      inputMode={resolvedInputMode}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onChange={(event) => {
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
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled || index < 0) return;
        if (event.key === "Backspace") {
          event.preventDefault();
          if (character) context.clearCharacter(index);
          else context.focusField(index - 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          const step = writingDirection(event.currentTarget) === "rtl" ? 1 : -1;
          context.focusField(index + step);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          const step = writingDirection(event.currentTarget) === "rtl" ? -1 : 1;
          context.focusField(index + step);
        }
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (event.defaultPrevented || resolvedDisabled || index < 0) return;
        event.preventDefault();
        const text = acceptedCharacters(event.clipboardData.getData("text"), context.type);
        if (!text) return;
        context.pasteCode(index, text);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        event.currentTarget.select();
      }}
    />
  );
}
