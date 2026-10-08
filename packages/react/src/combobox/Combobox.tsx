import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { dataAttr, useCollection, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { FormValue } from "../internal/form-value.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { useFormReset } from "../internal/form-control-state.js";
import { ComboboxContext } from "./combobox-shared.js";

const defaultFilter = (textValue: string, inputValue: string) =>
  textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase());

export type ComboboxProps = RootProps<{
  /** Base for the generated input, listbox and field ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  /** The committed logical option value. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the committed logical option value rather than a native ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial open state of the results; Combobox owns its own popover. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  /** Receives editable text; ComboboxInput.onChange still receives the native ChangeEvent. */
  onInputChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
  form?: string | undefined;
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  allowEmptyCollection?: boolean | undefined;
  /** Activates the first visible enabled option whenever the editable text changes. */
  autoHighlight?: boolean | undefined;
  children?: ReactNode | undefined;
}>;

export function Combobox({
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen,
  onOpenChange,
  inputValue: inputValueProp,
  defaultInputValue = "",
  onInputChange,
  filter = defaultFilter,
  allowEmptyCollection = false,
  autoHighlight = false,
  disabled,
  invalid,
  required,
  name,
  form,
  as,
  id,
  children,
  ...props
}: ComboboxProps) {
  const ids = useFieldIds(id);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onOpenChange,
    triggerId: ids.controlId,
    contentId: `${ids.controlId}-listbox`,
  });
  const [activeKey, setActiveKey] = useState("");
  const collection = useCollection();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const [inputValue, setInputValue, inputState] = useControllableState({
    value: inputValueProp,
    defaultValue: defaultInputValue,
    onChange: onInputChange,
  });
  const [selected, setSelected, selectedState] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  useFormReset({
    controlRef: inputRef,
    form,
    state: inputState,
    readValue: (element) => element.value,
  });
  useFormReset({
    controlRef: inputRef,
    form,
    state: selectedState,
    readValue: () => selected,
  });
  const selectedText =
    useSyncExternalStore(
      collection.subscribe,
      () => collection.get(selected)?.textValue,
      () => undefined,
    ) ?? selected;
  const setSelectedKey = (key: string) => {
    setSelected(key);
    const text = collection.get(key)?.textValue;
    if (text !== undefined) setInputValue(text);
  };
  const isItemVisible = (textValue: string) =>
    allowEmptyCollection || inputValue === "" || filter(textValue, inputValue);
  useLayoutEffect(() => {
    if (!autoHighlight || !popover.open) return;
    const highlightFirst = () => {
      const first = collection.enabledItems()[0];
      setActiveKey(first?.key ?? "");
      first?.element?.scrollIntoView?.({ block: "nearest" });
    };
    highlightFirst();
    return collection.subscribe(highlightFirst);
  }, [autoHighlight, collection, inputValue, popover.open]);
  let displayValue = inputValue;
  if (displayValue === "" && selected) displayValue = selectedText;
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    ...feedback,
  };
  const context = {
    activeKey,
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
    form,
    inputRef,
    collection,
    popover,
    setActiveKey,
    setInputValue,
    setSelectedKey,
    isItemVisible,
  };

  const Root = rootElement(as);
  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <ComboboxContext value={context}>
          <Root
            data-slot="combobox"
            {...props}
            id={id}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-placeholder={dataAttr(displayValue === "")}
            data-required={dataAttr(resolvedRequired)}
            data-value={displayValue || undefined}
          >
            <>
              <FormValue
                name={name}
                form={form}
                value={selected || inputValue}
                disabled={resolvedDisabled}
              />
              {children}
            </>
          </Root>
        </ComboboxContext>
      </PopoverContext>
    </FieldProvider>
  );
}
