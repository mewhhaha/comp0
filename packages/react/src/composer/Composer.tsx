import { useRef, type ComponentProps, type SubmitEvent } from "react";
import { composeRefs, dataAttr, useControllableState } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { ComposerContext } from "./composer-shared.js";

export type ComposerProps = Omit<ComponentProps<"form">, "defaultValue" | "onChange"> &
  AsProp & {
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the next draft text rather than a DOM ChangeEvent. */
    onChange?: ((value: string) => void) | undefined;
    /**
     * Called with the draft when the user sends a non-empty message, by Enter or
     * the send control. The draft is cleared afterwards. This is not the form's
     * `onSubmit`, which still receives the native submit event first.
     */
    onSend?: ((value: string) => void) | undefined;
    /** Called when the user asks to stop the response being generated. */
    onStop?: (() => void) | undefined;
    /** True while a response is being generated: sending pauses and the stop control appears. */
    generating?: boolean | undefined;
    disabled?: boolean | undefined;
  };

/**
 * The message input of a chat surface: a native form around a textarea. Enter
 * sends, Shift+Enter inserts a newline, and Enter confirming an IME composition
 * never sends. Focus returns to the textarea after sending or stopping.
 */
export function Composer({
  as,
  value: valueProp,
  defaultValue = "",
  onChange,
  onSend,
  onStop,
  generating = false,
  disabled = false,
  onSubmit,
  ref,
  ...props
}: ComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const submit = () => formRef.current?.requestSubmit();
  const stop = () => {
    onStop?.();
    inputRef.current?.focus();
  };

  const Part = partElement(as, "form");
  return (
    <ComposerContext value={{ value, setValue, generating, disabled, inputRef, submit, stop }}>
      <Part
        data-slot="composer"
        {...props}
        ref={composeRefs(ref, formRef)}
        data-generating={dataAttr(generating)}
        data-disabled={dataAttr(disabled)}
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
          onSubmit?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          if (disabled || generating || value.trim() === "") return;
          onSend?.(value);
          setValue("");
          inputRef.current?.focus();
        }}
      />
    </ComposerContext>
  );
}
