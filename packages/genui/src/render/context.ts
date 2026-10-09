import { createContext, use } from "react";
import { type JsonValue } from "../json/parse.js";
import { type GenUIStore } from "../state/store.js";

/**
 * What a response asks the host to do: a pressed button, a submitted form, or a chosen
 * suggestion. `message` is the human-friendly text the host sends as the next user turn.
 */
export type GenUIAction = {
  type: "button" | "form" | "suggestion";
  /** The name of the form the action belongs to, when it came from a form or sits in one. */
  name?: string | undefined;
  /** The person's request in their own words, such as `Plan: Pro; Seats: 5` for a form. */
  message: string;
  /** The values of the form's controls by control name, when the action belongs to a form. */
  values?: Record<string, JsonValue> | undefined;
};

export type GenUIContextValue = {
  store: GenUIStore;
  /** Whether the response is still arriving; actions wait until it is complete. */
  streaming: boolean;
  /** The binding names the response declares, with the first initial value written for each. */
  bindings: ReadonlyMap<string, JsonValue | undefined>;
  /** Hands an action to the host. */
  act: (action: GenUIAction) => void;
};

export const GenUIContext = createContext<GenUIContextValue | null>(null);

/** The renderer's context; a facade used outside `GenUI` is a programmer error. */
export function useGenUI(): GenUIContextValue {
  const value = use(GenUIContext);
  if (value === null) throw new Error("A GenUI facade must render inside <GenUI>.");
  return value;
}
