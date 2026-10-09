import { type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { useComposerContext } from "./composer-shared.js";

export type ComposerInputProps = Omit<ComponentProps<"textarea">, "value" | "defaultValue">;

/**
 * The draft textarea. Give it an accessible name with a `<label>` or
 * `aria-label`. Enter sends; Shift+Enter and Alt+Enter keep the native newline.
 */
export function ComposerInput({ onChange, onKeyDown, ref, ...props }: ComposerInputProps) {
  const composer = useComposerContext("ComposerInput");

  return (
    <textarea
      name="message"
      rows={1}
      enterKeyHint="send"
      data-slot="composer-input"
      {...props}
      ref={composeRefs(ref, composer.inputRef)}
      value={composer.value}
      disabled={composer.disabled || props.disabled}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(event);
        composer.setValue(event.currentTarget.value);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Enter") return;
        if (event.shiftKey || event.altKey) return;
        // keyCode 229 is how browsers report the Enter that confirms an IME composition.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        event.preventDefault();
        composer.submit();
      }}
    />
  );
}
