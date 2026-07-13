import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import { AutocompleteContext, type AutocompleteContextValue } from "./autocomplete-shared.js";

export type AutocompleteProps = {
  children: ReactNode;
  /** Filters rendered collection items. Omit when the caller supplies an already filtered list. Items whose child text cannot be read during render must provide textValue or aria-label. */
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputChange?: ((inputValue: string) => void) | undefined;
  /** Leaves virtual focus empty after the filter value changes. */
  disableAutoFocusFirst?: boolean | undefined;
  /** Restores the wrapped collection's normal focus behavior. */
  disableVirtualFocus?: boolean | undefined;
};

export function Autocomplete({
  children,
  defaultInputValue = "",
  disableAutoFocusFirst = false,
  disableVirtualFocus = false,
  filter,
  inputValue: inputValueProp,
  onInputChange,
}: AutocompleteProps) {
  const generatedId = useId().replace(/:/g, "");
  const defaultCollectionId = `autocomplete-${generatedId}-collection`;
  const collectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const pendingAutoFocusValue = useRef<string | null>(null);
  const [inputValue, setInputValueState] = useControllableState({
    value: inputValueProp,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
  const previousInputValue = useRef(inputValue);
  const [activeId, setActiveId] = useState("");
  const [collectionId, setCollectionId] = useState<string>();
  const [collectionVersion, setCollectionVersion] = useState(0);

  const availableItems = () =>
    [
      ...(collectionRef.current?.querySelectorAll<HTMLElement>("[data-autocomplete-item]") ?? []),
    ].filter(
      (item) =>
        item.getAttribute("aria-disabled") !== "true" &&
        item.closest("[hidden], [aria-hidden='true']") === null,
    );

  const clearActive = () => setActiveId("");

  const setInputValue = (nextInputValue: string, inputType?: string) => {
    const resolvedInputType =
      inputType ||
      (nextInputValue.length > inputValue.length ? "insertText" : "deleteContentBackward");
    const typedForward =
      resolvedInputType === "insertText" ||
      resolvedInputType === "insertCompositionText" ||
      resolvedInputType === "insertFromComposition";
    pendingAutoFocusValue.current = typedForward ? nextInputValue : null;
    clearActive();
    setInputValueState(nextInputValue);
  };

  const handleInputKeyDown: AutocompleteContextValue["handleInputKeyDown"] = (event) => {
    if (disableVirtualFocus || event.nativeEvent.isComposing) return;
    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      pendingAutoFocusValue.current = null;
      clearActive();
      return;
    }
    if (event.key === "Escape" || event.key === "Tab") {
      pendingAutoFocusValue.current = null;
      clearActive();
      return;
    }
    if (event.key === "Enter" && activeId) {
      const activeItem = document.getElementById(activeId);
      if (!activeItem || !collectionRef.current?.contains(activeItem)) {
        pendingAutoFocusValue.current = null;
        clearActive();
        return;
      }
      event.preventDefault();
      activeItem.click();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    const items = availableItems();
    if (items.length === 0) {
      pendingAutoFocusValue.current = null;
      clearActive();
      return;
    }
    event.preventDefault();
    const currentIndex = items.findIndex((item) => item.id === activeId);
    let nextItem = items[0];
    if (event.key === "ArrowUp") {
      nextItem = items[currentIndex < 0 ? items.length - 1 : Math.max(currentIndex - 1, 0)];
    } else if (event.key === "ArrowDown") {
      nextItem = items[currentIndex < 0 ? 0 : Math.min(currentIndex + 1, items.length - 1)];
    }
    if (!nextItem) return;
    setActiveId(nextItem.id);
    nextItem.scrollIntoView?.({ block: "nearest" });
  };

  useLayoutEffect(() => {
    if (disableVirtualFocus || disableAutoFocusFirst) {
      clearActive();
      pendingAutoFocusValue.current = null;
      previousInputValue.current = inputValue;
      return;
    }
    const inputChanged = previousInputValue.current !== inputValue;
    previousInputValue.current = inputValue;
    if (pendingAutoFocusValue.current !== inputValue) {
      if (inputChanged) clearActive();
      return;
    }
    const firstItem = availableItems()[0];
    if (!firstItem) {
      clearActive();
      return;
    }
    pendingAutoFocusValue.current = null;
    setActiveId(firstItem.id);
  }, [collectionVersion, disableAutoFocusFirst, disableVirtualFocus, inputValue]);

  useLayoutEffect(() => {
    if (!activeId) return;
    if (!availableItems().some((item) => item.id === activeId)) clearActive();
  });

  const context = {
    activeId,
    collectionId,
    defaultCollectionId,
    collectionRef,
    disableVirtualFocus,
    hasFilter: filter !== undefined,
    inputRef,
    inputValue,
    clearActive,
    handleInputKeyDown,
    isItemVisible(textValue: string) {
      return filter ? filter(textValue, inputValue) : true;
    },
    setCollectionId,
    setCollectionVersion,
    setActiveId,
    setInputValue,
  };

  return <AutocompleteContext value={context}>{children}</AutocompleteContext>;
}
