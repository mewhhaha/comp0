import { type RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";

export type PasswordSelection = {
  start: number;
  end: number;
  direction: "forward" | "backward" | "none" | null;
};

export type PasswordFieldContextValue = {
  announcement: string;
  inputRef: RefObject<HTMLInputElement | null>;
  /** The mounted input's id, for the toggle's aria-controls; undefined without an input. */
  inputId: string | undefined;
  setInputId: (id: string | undefined) => void;
  mounted: boolean;
  passwordVisible: boolean;
  selectionRef: RefObject<PasswordSelection | null>;
  captureSelection: () => void;
  hidePassword: () => void;
  toggleVisibility: () => void;
};

export const [PasswordFieldContext, usePasswordFieldContext] =
  createRequiredContext<PasswordFieldContextValue>("PasswordField");
