import { createContext, useContext, type RefObject } from "react";

export type PasswordSelection = {
  start: number;
  end: number;
  direction: "forward" | "backward" | "none" | null;
};

export type PasswordFieldContextValue = {
  announcement: string;
  inputRef: RefObject<HTMLInputElement | null>;
  mounted: boolean;
  passwordVisible: boolean;
  selectionRef: RefObject<PasswordSelection | null>;
  captureSelection: () => void;
  hidePassword: () => void;
  toggleVisibility: () => void;
};

export const PasswordFieldContext = createContext<PasswordFieldContextValue | null>(null);

export function usePasswordFieldContext(part: string) {
  const context = useContext(PasswordFieldContext);
  if (!context) throw new Error(`${part} must be rendered inside PasswordField.`);
  return context;
}
