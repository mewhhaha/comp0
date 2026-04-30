import {
  useCallback,
  useMemo,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useControllableState,
  useFocusRing,
  useHover,
} from "@comp0/core";
import { describedBy, FieldProvider, useFieldContext, useFieldIds } from "./field.js";
import {
  SearchFieldContext,
  useComboBoxRootContext,
  useSearchFieldContext,
  type RefProp,
} from "./shared.js";

export type TextFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function TextField({
  children,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  ref,
  ...props
}: TextFieldProps & RefProp<HTMLDivElement>) {
  const comboBox = useComboBoxRootContext();
  const fieldIds = useFieldIds(id);
  let ids = fieldIds;
  if (comboBox) {
    ids = {
      controlId: comboBox.inputId,
      labelId: comboBox.labelId,
      descriptionId: comboBox.descriptionId,
      errorId: `${comboBox.inputId}-error`,
    };
  }
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const controlsValue = value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const [fieldValue, setFieldValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const providerValue = {
    ...ids,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    value: controlsValue ? fieldValue : undefined,
    setValue: controlsValue ? setFieldValue : undefined,
  };

  return (
    <FieldProvider value={providerValue}>
      <div
        {...props}
        ref={ref}
        aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-invalid={dataAttr(resolvedInvalid)}
        data-required={dataAttr(resolvedRequired)}
      >
        {children}
      </div>
    </FieldProvider>
  );
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "disabled" | "required"> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
};

export function Input({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  onChange,
  onKeyDown,
  ref,
  ...props
}: InputProps & RefProp<HTMLInputElement>) {
  const field = useFieldContext();
  const comboBox = useComboBoxRootContext();
  const search = useSearchFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled ?? comboBox?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLInputElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);
  let inputValue = field?.value ?? props.value;
  if (comboBox) inputValue = comboBox.inputValue;
  else if (search?.controlled) inputValue = search.value;

  return (
    <input
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={ref}
      id={id ?? comboBox?.inputId ?? field?.controlId}
      role={props.role ?? (comboBox ? "combobox" : undefined)}
      type={props.type ?? (search ? "search" : undefined)}
      value={inputValue}
      disabled={disabled}
      required={required}
      aria-autocomplete={props["aria-autocomplete"] ?? (comboBox ? "list" : undefined)}
      aria-activedescendant={props["aria-activedescendant"] ?? comboBox?.activeKey ?? undefined}
      aria-controls={props["aria-controls"] ?? comboBox?.listBoxId}
      aria-describedby={description || undefined}
      aria-expanded={comboBox ? comboBox.open : props["aria-expanded"]}
      aria-haspopup={props["aria-haspopup"] ?? (comboBox ? "listbox" : undefined)}
      aria-invalid={field?.invalid || undefined}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(field?.invalid)}
      data-open={dataAttr(comboBox?.open)}
      data-placeholder={dataAttr(comboBox ? comboBox.inputValue === "" : undefined)}
      data-required={dataAttr(required)}
      data-value={comboBox?.inputValue || undefined}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented && comboBox) {
          comboBox.setInputValue(event.currentTarget.value);
          comboBox.setOpen(true);
        } else if (!event.defaultPrevented && search) {
          search.setValue(event.currentTarget.value);
        } else if (!event.defaultPrevented && field?.setValue) {
          field.setValue(event.currentTarget.value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (search && event.key === "Escape" && event.currentTarget.value !== "") {
          event.preventDefault();
          if (!search.controlled) event.currentTarget.value = "";
          search.clear();
          return;
        }
        if (search && event.key === "Enter") {
          search.submit(event.currentTarget.value);
        }
        if (event.defaultPrevented || !comboBox) return;

        const listBox = document.getElementById(comboBox.listBoxId);
        const options = [
          ...(listBox?.querySelectorAll<HTMLElement>("[role='option'],[role='menuitem']") ?? []),
        ].filter((option) => option.getAttribute("aria-disabled") !== "true");
        const currentIndex = options.findIndex(
          (option) => option.id === (comboBox.activeKey || comboBox.selectedKey),
        );
        const setActiveOption = (index: number) => {
          const option = options.at(index);
          if (!option) return;
          event.preventDefault();
          comboBox.setOpen(true);
          comboBox.setActiveKey(option.id);
          option.scrollIntoView?.({ block: "nearest" });
        };

        if (event.key === "ArrowDown") {
          setActiveOption(Math.min(currentIndex + 1, options.length - 1));
        } else if (event.key === "ArrowUp") {
          setActiveOption(currentIndex < 0 ? options.length - 1 : Math.max(currentIndex - 1, 0));
        } else if (event.key === "Home") {
          setActiveOption(0);
        } else if (event.key === "End") {
          setActiveOption(options.length - 1);
        } else if (event.key === "Enter" && comboBox.open && comboBox.activeKey) {
          event.preventDefault();
          comboBox.setSelectedKey(comboBox.activeKey);
          comboBox.setOpen(false);
          event.currentTarget.focus();
        } else if (event.key === "Escape" && comboBox.open) {
          event.preventDefault();
          comboBox.setOpen(false);
        }
      }}
    />
  );
}

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "disabled" | "required"
> & {
  disabled?: boolean | undefined;
  required?: boolean | undefined;
};

export function TextArea({
  id,
  disabled: disabledProp,
  required: requiredProp,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: TextAreaProps & RefProp<HTMLTextAreaElement>) {
  const field = useFieldContext();
  const disabled = Boolean(disabledProp ?? field?.disabled);
  const required = Boolean(requiredProp ?? field?.required);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLTextAreaElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLTextAreaElement>({ disabled });
  const description = describedBy(field, ariaDescribedBy);

  return (
    <textarea
      {...mergeProps(props, mergeInteractionProps(focusProps, hoverProps))}
      ref={ref}
      id={id ?? field?.controlId}
      disabled={disabled}
      required={required}
      aria-describedby={description || undefined}
      aria-invalid={field?.invalid || undefined}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      data-hovered={dataAttr(isHovered)}
      data-invalid={dataAttr(field?.invalid)}
      data-required={dataAttr(required)}
    />
  );
}

export type SearchFieldProps = Omit<TextFieldProps, "onSubmit"> & {
  onSubmit?: ((value: string) => void) | undefined;
  onClear?: (() => void) | undefined;
};

export function SearchField({
  children,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  ref,
  ...props
}: SearchFieldProps & RefProp<HTMLDivElement>) {
  const [searchValue, setSearchValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const controlsValue = value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const clear = useCallback(() => {
    setSearchValue("");
    onClear?.();
  }, [onClear, setSearchValue]);
  const submit = useCallback(
    (value = searchValue) => {
      onSubmit?.(value);
    },
    [onSubmit, searchValue],
  );
  const context = useMemo(
    () => ({
      value: searchValue,
      disabled: Boolean(props.disabled),
      controlled: controlsValue,
      clear,
      submit,
      setValue: setSearchValue,
    }),
    [clear, controlsValue, props.disabled, searchValue, setSearchValue, submit],
  );

  return (
    <SearchFieldContext.Provider value={context}>
      <TextField
        {...props}
        ref={ref}
        {...(controlsValue ? { value: searchValue, onChange: setSearchValue } : {})}
        data-search=""
      >
        {children}
      </TextField>
    </SearchFieldContext.Provider>
  );
}
