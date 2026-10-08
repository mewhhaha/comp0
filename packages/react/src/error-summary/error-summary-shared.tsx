import { createRequiredContext } from "../internal/context.js";

export type ErrorSummaryContextValue = {
  titleId: string;
};

export const [ErrorSummaryContext, useErrorSummaryContext] =
  createRequiredContext<ErrorSummaryContextValue>("ErrorSummary");
