import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useCollectionNavigation, useControllableState, type Collection } from "@comp0/core";
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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const pendingAutoFocusValue = useRef<string | null>(null);
  const [inputValue, setInputValueState] = useControllableState({
    value: inputValueProp,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
  const navigate = useCollectionNavigation();
  const previousInputValue = useRef(inputValue);
  const [activeId, setActiveId] = useState("");
  const [collectionId, setCollectionId] = useState<string>();
  const [collectionVersion, setCollectionVersion] = useState(0);

  const attachedCollection = useRef<Collection | null>(null);
  // Identity matters: collections attach from an effect that depends on this
  // function, so a new function per render (after a compiler bailout) would
  // re-attach and bump the version forever.
  const attachCollection = useCallback((collection: Collection) => {
    attachedCollection.current = collection;
    const unsubscribe = collection.subscribe(() => setCollectionVersion((version) => version + 1));
    setCollectionVersion((version) => version + 1);
    return () => {
      unsubscribe();
      if (attachedCollection.current === collection) attachedCollection.current = null;
      setCollectionVersion((version) => version + 1);
    };
  }, []);
  const availableItems = () =>
    (attachedCollection.current?.items() ?? []).filter(
      (item) =>
        !item.disabled &&
        item.element !== null &&
        item.element.closest("[hidden], [aria-hidden='true']") === null,
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
      const activeItem = attachedCollection.current?.items().find((item) => item.id === activeId);
      if (!activeItem?.element) {
        pendingAutoFocusValue.current = null;
        clearActive();
        return;
      }
      event.preventDefault();
      activeItem.element.click();
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
    const nextId = navigate(
      event.key,
      items.map((item) => ({ key: item.id ?? item.key, textValue: item.textValue })),
      activeId || undefined,
      { orientation: "vertical", typeahead: false },
    );
    const nextItem = items.find((item) => (item.id ?? item.key) === nextId);
    if (!nextItem?.element) return;
    setActiveId(nextItem.id ?? nextItem.key);
    nextItem.element.scrollIntoView?.({ block: "nearest" });
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
    setActiveId(firstItem.id ?? firstItem.key);
  }, [collectionVersion, disableAutoFocusFirst, disableVirtualFocus, inputValue]);

  useLayoutEffect(() => {
    if (!activeId) return;
    if (!availableItems().some((item) => item.id === activeId)) clearActive();
  });

  const context = {
    activeId,
    attachCollection,
    collectionId,
    defaultCollectionId,
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
    setActiveId,
    setInputValue,
  };

  return <AutocompleteContext value={context}>{children}</AutocompleteContext>;
}
