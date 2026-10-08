import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type PinInputType = "numeric" | "alphanumeric";

export type PinInputContextValue = {
  value: string;
  type: PinInputType;
  mask: boolean;
  disabled: boolean;
  collection: Collection;
  /** Field keys in document order; a field's position in it is its character index. */
  order: string[];
  setCharacter: (index: number, character: string) => void;
  clearCharacter: (index: number) => void;
  pasteCode: (index: number, text: string) => void;
  focusField: (index: number) => void;
};

export const [PinInputContext, usePinInputContext] =
  createRequiredContext<PinInputContextValue>("PinInput");

/** Keeps only the characters the pin type accepts. */
export function acceptedCharacters(text: string, type: PinInputType) {
  const pattern = type === "numeric" ? /[0-9]/ : /[0-9a-zA-Z]/;
  return [...text].filter((character) => pattern.test(character)).join("");
}
