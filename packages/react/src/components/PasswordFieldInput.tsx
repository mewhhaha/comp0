import { useEffect, useEffectEvent } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { Input } from "./Input.js";
import { usePasswordFieldContext } from "./password-field-shared.js";
import { type InputProps } from "./text-field-shared.js";

export type PasswordFieldInputProps = Omit<InputProps, "type">;

export function PasswordFieldInput({
  autoCapitalize,
  form,
  spellCheck,
  ref,
  ...props
}: PasswordFieldInputProps & RefProp<HTMLInputElement>) {
  const passwordField = usePasswordFieldContext("PasswordFieldInput");
  const { hidePassword, inputRef, passwordVisible, selectionRef } = passwordField;
  const handleSubmit = useEffectEvent(() => hidePassword());

  useEffect(() => {
    const owningForm = inputRef.current?.form;
    if (!owningForm) return;
    owningForm.addEventListener("submit", handleSubmit);
    return () => owningForm.removeEventListener("submit", handleSubmit);
  }, [form, inputRef]);

  useEffect(() => {
    const selection = selectionRef.current;
    if (!selection) return;
    const animationFrame = window.requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(
        selection.start,
        selection.end,
        selection.direction ?? undefined,
      );
      selectionRef.current = null;
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [inputRef, passwordVisible, selectionRef]);

  return (
    <Input
      {...props}
      ref={composeRefs(ref, inputRef)}
      type={passwordVisible ? "text" : "password"}
      data-visible={dataAttr(passwordVisible)}
      form={form}
      spellCheck={spellCheck ?? false}
      autoCapitalize={autoCapitalize ?? "none"}
    />
  );
}
