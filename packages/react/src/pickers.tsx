import {
  useCallback,
  useMemo,
  useState,
  type HTMLAttributes,
  type OptionHTMLAttributes,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldIds } from "./field.js";
import {
  ComboBoxRootContext,
  SelectRootContext,
  useSelectRootContext,
  type RefProp,
} from "./shared.js";

export type SelectProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
};

export function Select({
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  name,
  children,
  ref,
  ...props
}: SelectProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const [open, setOpen] = useState(false);
  const [itemText, setItemText] = useState<Record<string, ReactNode>>({});
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
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
  const context = useMemo(
    () => ({
      disabled: resolvedDisabled,
      open,
      selectedKey: selected,
      triggerId: ids.controlId,
      listBoxId: `${ids.controlId}-listbox`,
      popoverId: `${ids.controlId}-popover`,
      labelId: ids.labelId,
      descriptionId: ids.descriptionId,
      selectedText: itemText[selected],
      setOpen,
      setSelectedKey: setSelected,
      registerItem,
      unregisterItem,
    }),
    [
      ids.controlId,
      ids.descriptionId,
      ids.labelId,
      resolvedDisabled,
      itemText,
      open,
      registerItem,
      selected,
      setSelected,
      unregisterItem,
    ],
  );

  return (
    <FieldProvider
      value={{
        ...ids,
        disabled: resolvedDisabled,
        invalid: resolvedInvalid,
        required: resolvedRequired,
      }}
    >
      <SelectRootContext.Provider value={context}>
        <div
          {...props}
          ref={ref}
          id={id}
          aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
          data-disabled={dataAttr(resolvedDisabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-open={dataAttr(open)}
          data-placeholder={dataAttr(selected === "")}
          data-required={dataAttr(resolvedRequired)}
          data-value={selected || undefined}
        >
          {name && <input type="hidden" name={name} value={selected} disabled={resolvedDisabled} />}
          {children}
        </div>
      </SelectRootContext.Provider>
    </FieldProvider>
  );
}

export type SelectValueProps = HTMLAttributes<HTMLSpanElement> & {
  value?: ReactNode;
  placeholder?: ReactNode;
};

export function SelectValue({
  value,
  placeholder,
  ref,
  ...props
}: SelectValueProps & RefProp<HTMLSpanElement>) {
  const select = useSelectRootContext();
  const resolvedValue = value ?? select?.selectedText;
  const isPlaceholder = resolvedValue === undefined || resolvedValue === "";

  return (
    <span {...props} ref={ref} data-placeholder={dataAttr(isPlaceholder)}>
      {isPlaceholder ? placeholder : resolvedValue}
    </span>
  );
}

export type SelectOptionProps = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "disabled" | "value"
> & {
  value: string;
  label?: string | undefined;
  disabled?: boolean | undefined;
};

export function SelectOption({
  value,
  label,
  disabled,
  ref,
  ...props
}: SelectOptionProps & RefProp<HTMLOptionElement>) {
  const optionDisabled = Boolean(disabled);

  return (
    <option
      {...props}
      ref={ref}
      value={value}
      label={label}
      disabled={optionDisabled}
      data-disabled={dataAttr(optionDisabled)}
      data-label={label}
      data-value={value}
    />
  );
}

export type ComboboxOptionProps = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "disabled" | "value"
> & {
  value: string;
  label?: string | undefined;
  disabled?: boolean | undefined;
};

export type ComboboxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  selectedValue?: string | undefined;
  defaultSelectedValue?: string | undefined;
  onSelectedValueChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
};

export function ComboboxOption({
  value,
  label,
  disabled,
  ref,
  ...props
}: ComboboxOptionProps & RefProp<HTMLOptionElement>) {
  const optionDisabled = Boolean(disabled);

  return (
    <option
      {...props}
      ref={ref}
      value={value}
      label={label}
      disabled={optionDisabled}
      data-disabled={dataAttr(optionDisabled)}
      data-label={label}
      data-value={value}
    />
  );
}

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
  const [itemText, setItemText] = useState<Record<string, ReactNode>>({});
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
      setSelected(key);
      const text = itemText[key];
      if (typeof text === "string") setInputValue(text);
    },
    [itemText, setInputValue, setSelected],
  );
  const context = useMemo(
    () => ({
      activeKey,
      disabled: resolvedDisabled,
      open,
      inputValue,
      selectedKey: selected,
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
      ids.controlId,
      ids.descriptionId,
      ids.labelId,
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
    <FieldProvider
      value={{
        ...ids,
        disabled: resolvedDisabled,
        invalid: resolvedInvalid,
        required: resolvedRequired,
      }}
    >
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
