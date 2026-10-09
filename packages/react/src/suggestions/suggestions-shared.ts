import { createRequiredContext } from "../internal/context.js";

export type SuggestionsContextValue = {
  disabled: boolean;
  send: (value: string) => void;
};

export const [SuggestionsContext, useSuggestionsContext] =
  createRequiredContext<SuggestionsContextValue>("Suggestions");
