import { createContext, type HTMLAttributes, type InputHTMLAttributes } from "react";

export type PinInputType = "numeric" | "alphanumeric";

export type PinInputProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the joined code; shadows the DOM onChange. */
  onChange?: ((value: string) => void) | undefined;
  /** Fires once each time typing or pasting fills every field. */
  onComplete?: ((value: string) => void) | undefined;
  /** Accepted characters; numeric filters to digits and is the default. */
  type?: PinInputType | undefined;
  /** Renders the fields as password inputs so entered characters stay hidden. */
  mask?: boolean | undefined;
  /** Submits one hidden input carrying the joined code. */
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
};

export type PinInputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "maxLength"
>;

export interface PinInputContextValue {
  value: string;
  type: PinInputType;
  mask: boolean;
  disabled: boolean;
  fields: HTMLInputElement[];
  register: (element: HTMLInputElement) => () => void;
  setCharacter: (index: number, character: string) => void;
  clearCharacter: (index: number) => void;
  pasteCode: (index: number, text: string) => void;
  focusField: (index: number) => void;
}

export const PinInputContext = createContext<PinInputContextValue | null>(null);

/** Keeps only the characters the pin type accepts. */
export function acceptedCharacters(text: string, type: PinInputType) {
  const pattern = type === "numeric" ? /[0-9]/ : /[0-9a-zA-Z]/;
  return [...text].filter((character) => pattern.test(character)).join("");
}
