import {
  Children,
  createContext,
  isValidElement,
  useContext,
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
  collectionRef: RefObject<HTMLElement | null>;
  disableVirtualFocus: boolean;
  hasFilter: boolean;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  inputValue: string;
  clearActive: () => void;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isItemVisible: (textValue: string) => boolean;
  setCollectionId: Dispatch<SetStateAction<string | undefined>>;
  setCollectionVersion: Dispatch<SetStateAction<number>>;
  setActiveId: (id: string) => void;
  setInputValue: (inputValue: string, inputType?: string) => void;
};

export const AutocompleteContext = createContext<AutocompleteContextValue | null>(null);

export function useAutocompleteContext() {
  return useContext(AutocompleteContext);
}

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
