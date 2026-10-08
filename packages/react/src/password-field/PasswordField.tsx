import { useEffect, useEffectEvent, useRef, useState } from "react";
import { dataAttr } from "@comp0/core";
import { type RootProps } from "../internal/polymorphic.js";
import { TextField, type TextFieldOwnProps } from "../text-field/TextField.js";
import { PasswordFieldContext, type PasswordSelection } from "./password-field-shared.js";

export type PasswordFieldProps = RootProps<
  TextFieldOwnProps & {
    visibleAnnouncement?: string | undefined;
    hiddenAnnouncement?: string | undefined;
  }
>;

export function PasswordField({
  children,
  visibleAnnouncement,
  hiddenAnnouncement,
  ...props
}: PasswordFieldProps) {
  const visibleText = visibleAnnouncement ?? "Your password is visible.";
  const hiddenText = hiddenAnnouncement ?? "Your password is hidden.";
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<PasswordSelection | null>(null);
  const [mounted, setMounted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [inputId, setInputId] = useState<string | undefined>(undefined);

  function captureSelection() {
    const input = inputRef.current;
    if (!input || input.selectionStart === null || input.selectionEnd === null) return;
    selectionRef.current = {
      start: input.selectionStart,
      end: input.selectionEnd,
      direction: input.selectionDirection,
    };
  }

  function hidePassword() {
    if (inputRef.current?.type === "text") captureSelection();
    setPasswordVisible(false);
    setAnnouncement("");
  }

  function toggleVisibility() {
    if (!selectionRef.current) captureSelection();
    const nextPasswordVisible = !passwordVisible;
    setPasswordVisible(nextPasswordVisible);
    setAnnouncement(nextPasswordVisible ? visibleText : hiddenText);
  }

  const handlePageShow = useEffectEvent((event: PageTransitionEvent) => {
    if (event.persisted) hidePassword();
  });

  useEffect(() => {
    setMounted(true);
    const ownerWindow = inputRef.current?.ownerDocument.defaultView;
    ownerWindow?.addEventListener("pageshow", handlePageShow);
    return () => ownerWindow?.removeEventListener("pageshow", handlePageShow);
  }, []);

  const context = {
    announcement,
    inputRef,
    inputId,
    setInputId,
    mounted,
    passwordVisible,
    selectionRef,
    captureSelection,
    hidePassword,
    toggleVisibility,
  };

  return (
    <PasswordFieldContext value={context}>
      <TextField {...props} data-visible={dataAttr(passwordVisible)}>
        {children}
      </TextField>
    </PasswordFieldContext>
  );
}
