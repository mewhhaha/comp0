import { useEffect, useEffectEvent } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { useFieldContext } from "../field/field-shared.js";
import { Input, type InputProps } from "../text-field/Input.js";
import { usePasswordFieldContext } from "./password-field-shared.js";

export type PasswordFieldInputProps = Omit<InputProps, "type">;

export function PasswordFieldInput({
  autoCapitalize,
  form,
  spellCheck,
  ref,
  ...props
}: PasswordFieldInputProps) {
  const passwordField = usePasswordFieldContext("PasswordFieldInput");
  const { hidePassword, inputRef, passwordVisible, selectionRef, setInputId } = passwordField;
  const field = useFieldContext();
  const inputId = props.id ?? field?.controlId;
  const handleSubmit = useEffectEvent(() => hidePassword());

  useEffect(() => {
    setInputId(inputId);
    return () => setInputId(undefined);
  }, [inputId, setInputId]);

  useEffect(() => {
    const owningForm = inputRef.current?.form;
    if (!owningForm) return;
    owningForm.addEventListener("submit", handleSubmit);
    return () => owningForm.removeEventListener("submit", handleSubmit);
  }, [form, inputRef]);

  useEffect(() => {
    const selection = selectionRef.current;
    if (!selection) return;
    const ownerWindow = inputRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const animationFrame = ownerWindow.requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(
        selection.start,
        selection.end,
        selection.direction ?? undefined,
      );
      selectionRef.current = null;
    });
    return () => ownerWindow.cancelAnimationFrame(animationFrame);
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
