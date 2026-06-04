import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldIds } from "../field.js";
import { ComboBoxRootContext, type RefProp } from "../shared.js";
import { type ComboboxProps } from "./pickers-shared.js";
export type { ComboboxProps } from "./pickers-shared.js";
export function Combobox({
  value,
  defaultValue = "",
  onChange,
  selectedValue,
  defaultSelectedValue,
  onSelectedValueChange,
  disabled,
  invalid,
  required,
  name,
  id,
  children,
  ref,
  ...props
}: ComboboxProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState("");
  const itemTextRef = useRef(new Map<string, ReactNode>());
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const [inputValue, setInputValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const [selected, setSelected] = useControllableState({
    value: selectedValue,
    defaultValue: defaultSelectedValue ?? "",
    onChange: onSelectedValueChange,
  });
  const registerItem = useCallback((key: string, textValue: ReactNode) => {
    itemTextRef.current.set(key, textValue);
  }, []);
  const unregisterItem = useCallback((key: string) => {
    itemTextRef.current.delete(key);
  }, []);
  const setSelectedKey = useCallback(
    (key: string) => {
      setSelected(key);
      const text = itemTextRef.current.get(key);
      if (typeof text === "string") setInputValue(text);
    },
    [setInputValue, setSelected],
  );
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
    }),
    [
      controlId,
      descriptionId,
      errorId,
      labelId,
      resolvedDisabled,
      resolvedInvalid,
      resolvedRequired,
    ],
  );
  const context = useMemo(
    () => ({
      activeKey,
      disabled: resolvedDisabled,
      open,
      inputValue,
      selectedKey: selected,
      inputId: controlId,
      listBoxId: `${controlId}-listbox`,
      popoverId: `${controlId}-popover`,
      labelId,
      descriptionId,
      setActiveKey,
      setOpen,
      setInputValue,
      setSelectedKey,
      registerItem,
      unregisterItem,
    }),
    [
      controlId,
      descriptionId,
      labelId,
      activeKey,
      inputValue,
      resolvedDisabled,
      open,
      registerItem,
      selected,
      setInputValue,
      setSelectedKey,
      unregisterItem,
    ],
  );

  return (
    <FieldProvider value={fieldContext}>
      <ComboBoxRootContext.Provider value={context}>
        <div
          {...props}
          ref={ref}
          id={id}
          aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
          data-disabled={dataAttr(resolvedDisabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-open={dataAttr(open)}
          data-placeholder={dataAttr(inputValue === "")}
          data-required={dataAttr(resolvedRequired)}
          data-selected-key={selected || undefined}
          data-value={inputValue || undefined}
        >
          {name && (
            <input
              type="hidden"
              name={name}
              value={selected || inputValue}
              disabled={resolvedDisabled}
            />
          )}
          {children}
        </div>
      </ComboBoxRootContext.Provider>
    </FieldProvider>
  );
}
