import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { ComboBoxRootContext, PickerRootContext, type RefProp } from "../shared.js";
import { defaultFilter, type ComboboxProps } from "./pickers-shared.js";
export type { ComboboxProps } from "./pickers-shared.js";
export function Combobox({
  value,
  defaultValue,
  onChange,
  inputValue: inputValueProp,
  defaultInputValue = "",
  onInputChange,
  filter = defaultFilter,
  allowsEmptyCollection = false,
  disabled,
  invalid,
  required,
  name,
  as,
  id,
  children,
  ref,
  ...props
}: ComboboxProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const feedback = useFieldFeedback();
  const [activeKey, setActiveKey] = useState("");
  const [activeId, setActiveId] = useState("");
  const itemTextRef = useRef(new Map<string, ReactNode>());
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const [inputValue, setInputValue] = useControllableState({
    value: inputValueProp,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [selectedText, setSelectedText] = useState(selected);
  useEffect(() => {
    const text = itemTextRef.current.get(selected);
    setSelectedText(typeof text === "string" ? text : selected);
  }, [selected]);
  const registerItem = useCallback((key: string, textValue: ReactNode) => {
    itemTextRef.current.set(key, textValue);
    if (key === selectedRef.current) {
      setSelectedText(typeof textValue === "string" ? textValue : key);
    }
  }, []);
  const unregisterItem = useCallback((key: string) => {
    itemTextRef.current.delete(key);
  }, []);
  const setSelectedKey = useCallback(
    (key: string) => {
      setSelected(key);
      const text = itemTextRef.current.get(key);
      setSelectedText(typeof text === "string" ? text : key);
      if (typeof text === "string") setInputValue(text);
    },
    [setInputValue, setSelected],
  );
  const isItemVisible = useCallback(
    (textValue: string) =>
      allowsEmptyCollection || inputValue === "" || filter(textValue, inputValue),
    [allowsEmptyCollection, filter, inputValue],
  );
  let displayValue = inputValue;
  if (displayValue === "" && selected) displayValue = selectedText;
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = useMemo(
    () => ({
      controlId,
      descriptionId,
      errorId,
      labelId,
      disabled: resolvedDisabled,
      invalid: resolvedInvalid,
      required: resolvedRequired,
      ...feedback,
    }),
    [
      controlId,
      descriptionId,
      errorId,
      feedback,
      labelId,
      resolvedDisabled,
      resolvedInvalid,
      resolvedRequired,
    ],
  );
  const context = useMemo(
    () => ({
      activeKey,
      activeId,
      disabled: resolvedDisabled,
      invalid: resolvedInvalid,
      required: resolvedRequired,
      displayValue,
      inputValue,
      selectedKey: selected,
      inputId: controlId,
      listBoxId: `${controlId}-listbox`,
      labelId,
      descriptionId,
      setActiveKey,
      setActiveId,
      setInputValue,
      setSelectedKey,
      registerItem,
      unregisterItem,
      isItemVisible,
    }),
    [
      controlId,
      descriptionId,
      labelId,
      activeKey,
      activeId,
      displayValue,
      inputValue,
      resolvedDisabled,
      resolvedInvalid,
      resolvedRequired,
      registerItem,
      selected,
      setInputValue,
      setSelectedKey,
      unregisterItem,
      isItemVisible,
    ],
  );

  const content = (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected || inputValue}
          disabled={resolvedDisabled}
        />
      )}
      {children}
    </>
  );
  const Root = as;
  return (
    <FieldProvider value={fieldContext}>
      <PickerRootContext.Provider
        value={{
          disabled: resolvedDisabled,
          triggerId: controlId,
          listBoxId: `${controlId}-listbox`,
        }}
      >
        <ComboBoxRootContext.Provider value={context}>
          {Root && Root !== Fragment ? (
            <Root
              {...props}
              ref={ref}
              id={id}
              aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
              data-disabled={dataAttr(resolvedDisabled)}
              data-invalid={dataAttr(resolvedInvalid)}
              data-placeholder={dataAttr(displayValue === "")}
              data-required={dataAttr(resolvedRequired)}
              data-selected-key={selected || undefined}
              data-value={displayValue || undefined}
            >
              {content}
            </Root>
          ) : (
            content
          )}
        </ComboBoxRootContext.Provider>
      </PickerRootContext.Provider>
    </FieldProvider>
  );
}
