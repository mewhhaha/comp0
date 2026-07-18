import { useEffect, useEffectEvent, useRef, useState } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { TextField, type TextFieldProps } from "./TextField.js";
import { PasswordFieldContext, type PasswordSelection } from "./password-field-shared.js";

export type PasswordFieldProps = TextFieldProps & {
  visibleAnnouncement?: string | undefined;
  hiddenAnnouncement?: string | undefined;
};

export function PasswordField({
  children,
  visibleAnnouncement = "Your password is visible.",
  hiddenAnnouncement = "Your password is hidden.",
  ref,
  ...props
}: PasswordFieldProps & RefProp<HTMLElement>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<PasswordSelection | null>(null);
  const [mounted, setMounted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [announcement, setAnnouncement] = useState("");

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
    setAnnouncement(nextPasswordVisible ? visibleAnnouncement : hiddenAnnouncement);
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
    mounted,
    passwordVisible,
    selectionRef,
    captureSelection,
    hidePassword,
    toggleVisibility,
  };

  return (
    <PasswordFieldContext value={context}>
      <TextField {...props} ref={ref} data-password="" data-visible={dataAttr(passwordVisible)}>
        {children}
      </TextField>
    </PasswordFieldContext>
  );
}
