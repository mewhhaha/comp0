import { useCallback, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFieldIds } from "./field.js";
import { AutocompleteContext, ComboBoxRootContext, type RefProp } from "./shared.js";

export type AutocompleteProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  allowsEmptyCollection?: boolean | undefined;
  disabled?: boolean | undefined;
  children?: ReactNode;
};

const defaultFilter = (textValue: string, inputValue: string) =>
  textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());

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
  const [itemText, setItemText] = useState<Record<string, ReactNode>>({});
  const [inputValue, setInputValue] = useControllableState({ value, defaultValue, onChange });
  const resolvedDisabled = Boolean(disabled);
  const registerItem = useCallback((key: string, textValue: ReactNode) => {
    setItemText((current) =>
      Object.is(current[key], textValue) ? current : { ...current, [key]: textValue },
    );
  }, []);
  const unregisterItem = useCallback((key: string) => {
    setItemText((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);
  const setSelectedKey = useCallback(
    (key: string) => {
      setSelectedKeyState(key);
      const text = itemText[key];
      if (typeof text === "string") setInputValue(text);
    },
    [itemText, setInputValue],
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
