import { createContext, useContext } from "react";

export type ErrorSummaryContextValue = {
  titleId: string;
};

export const ErrorSummaryContext = createContext<ErrorSummaryContextValue | null>(null);

export function useErrorSummaryContext(part: string) {
  const context = useContext(ErrorSummaryContext);
  if (!context) throw new Error(`${part} must be rendered inside ErrorSummary.`);
  return context;
}
