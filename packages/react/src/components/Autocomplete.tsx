import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFieldIds } from "../field.js";
import { AutocompleteContext, ComboBoxRootContext, type RefProp } from "../shared.js";
import { defaultFilter } from "./autocomplete-shared.js";
import { type AutocompleteProps } from "./autocomplete-shared.js";
export type { AutocompleteProps } from "./autocomplete-shared.js";
export function Autocomplete({
  id,
  value,
  defaultValue = "",
  onChange,
  filter = defaultFilter,
  allowsEmptyCollection = false,
  disabled,
  children,
  ref,
  ...props
}: AutocompleteProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState("");
  const [selectedKey, setSelectedKeyState] = useState("");
  const itemTextRef = useRef(new Map<string, ReactNode>());
  const [inputValue, setInputValue] = useControllableState({ value, defaultValue, onChange });
  const resolvedDisabled = Boolean(disabled);
  const registerItem = useCallback((key: string, textValue: ReactNode) => {
    itemTextRef.current.set(key, textValue);
  }, []);
  const unregisterItem = useCallback((key: string) => {
    itemTextRef.current.delete(key);
  }, []);
  const setSelectedKey = useCallback(
    (key: string) => {
      setSelectedKeyState(key);
      const text = itemTextRef.current.get(key);
      if (typeof text === "string") setInputValue(text);
    },
    [setInputValue],
  );
  const comboBoxContext = useMemo(
    () => ({
      activeKey,
      disabled: resolvedDisabled,
      open,
      inputValue,
      selectedKey,
      inputId: ids.controlId,
      listBoxId: `${ids.controlId}-listbox`,
      popoverId: `${ids.controlId}-popover`,
      labelId: ids.labelId,
      descriptionId: ids.descriptionId,
      setActiveKey,
      setOpen,
      setInputValue,
      setSelectedKey,
      registerItem,
      unregisterItem,
    }),
    [
      activeKey,
      ids.controlId,
      ids.descriptionId,
      ids.labelId,
      inputValue,
      open,
      registerItem,
      resolvedDisabled,
      selectedKey,
      setInputValue,
      setSelectedKey,
      unregisterItem,
    ],
  );
  const autocompleteContext = useMemo(
    () => ({
      inputValue,
      allowsEmptyCollection,
      isItemVisible(textValue: string) {
        return allowsEmptyCollection || inputValue === "" || filter(textValue, inputValue);
      },
      selectItem(key: string, textValue: string) {
        setSelectedKeyState(key);
        setInputValue(textValue);
        setOpen(false);
      },
    }),
    [allowsEmptyCollection, filter, inputValue, setInputValue],
  );

  return (
    <AutocompleteContext.Provider value={autocompleteContext}>
      <ComboBoxRootContext.Provider value={comboBoxContext}>
        <div
          {...props}
          ref={ref}
          id={id}
          data-disabled={dataAttr(resolvedDisabled)}
          data-open={dataAttr(open)}
          data-placeholder={dataAttr(inputValue === "")}
          data-selected-key={selectedKey || undefined}
          data-slot="autocomplete"
          data-value={inputValue || undefined}
        >
          {children}
        </div>
      </ComboBoxRootContext.Provider>
    </AutocompleteContext.Provider>
  );
}
