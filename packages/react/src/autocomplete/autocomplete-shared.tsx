import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import {
  Children,
  isValidElement,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

export type AutocompleteContextValue = {
  activeId: string;
  collectionId: string | undefined;
  defaultCollectionId: string;
  /**
   * Makes `collection` the set of items the input navigates and auto-focuses.
   * Returns the detach function; call it from an effect. The collection's own
   * changes (items mounting, unmounting, enabling) re-run the auto-focus logic.
   */
  attachCollection: (collection: Collection) => () => void;
  disableVirtualFocus: boolean;
  hasFilter: boolean;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  inputValue: string;
  clearActive: () => void;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isItemVisible: (textValue: string) => boolean;
  setCollectionId: Dispatch<SetStateAction<string | undefined>>;
  setActiveId: (id: string) => void;
  setInputValue: (inputValue: string, inputType?: string) => void;
};

// Every consumer (inputs, lists, items) also works without an Autocomplete
// ancestor, so only the optional reader is used.
export const [AutocompleteContext, , useAutocompleteContext] =
  createRequiredContext<AutocompleteContextValue>("Autocomplete");

export function resolveAutocompleteItemText(children: ReactNode) {
  let text = "";
  let hasElement = false;

  const appendText = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (typeof child === "string" || typeof child === "number" || typeof child === "bigint") {
        text += String(child);
        return;
      }
      if (!isValidElement<{ children?: ReactNode }>(child)) return;
      hasElement = true;
      appendText(child.props.children);
    });
  };

  appendText(children);
  return {
    hasElement,
    text: text.replace(/\s+/g, " ").trim() || undefined,
  };
}
