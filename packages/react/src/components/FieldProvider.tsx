import { type ReactNode } from "react";
import { FieldContext } from "./field-shared.js";
import { type FieldContextValue } from "./field-shared.js";
export function FieldProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FieldContextValue;
}) {
  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}
