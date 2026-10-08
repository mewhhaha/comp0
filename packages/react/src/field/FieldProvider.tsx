import { type ReactNode } from "react";
import { FieldContext, type FieldContextValue } from "./field-shared.js";

export type FieldProviderProps = {
  children: ReactNode;
  value: FieldContextValue;
};

export function FieldProvider({ children, value }: FieldProviderProps) {
  return <FieldContext value={value}>{children}</FieldContext>;
}
