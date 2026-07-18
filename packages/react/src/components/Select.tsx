import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { SelectRootContext, type RefProp } from "../shared.js";
import { resolveAutocompleteItemText } from "./autocomplete-shared.js";
import { PopoverContext, usePopoverState } from "./overlay-shared.js";
import { selectOptionPart, type SelectProps } from "./pickers-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
export type { SelectProps } from "./pickers-shared.js";

const nativeSelectStyle: CSSProperties = {
  border: 0,
  clipPath: "inset(50%)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

type DeclarativeSelectOptionProps = {
  "aria-label"?: string | undefined;
  children?: ReactNode;
  textValue?: string | undefined;
  value?: string | undefined;
};

type SelectOptionComponent = {
  [selectOptionPart]?: true;
};

export function Select({
  id,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen,
  onToggle,
  disabled,
  invalid,
  required,
  name,
  form,
  as,
  children,
  ref,
  ...props
}: SelectProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onToggle,
    triggerId: ids.controlId,
    contentId: `${ids.controlId}-listbox`,
  });
  const itemTextRef = useRef(new Map<string, ReactNode>());
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const selectedRef = useRef("");
  const [selectedText, setSelectedText] = useState<ReactNode>();
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const selectedState = useFormControlState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const selected = selectedState.value;
  const setSelected = selectedState.setValue;
  let declarativeSelectedText: ReactNode;
  const visitSelectOptions = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (declarativeSelectedText !== undefined) return;
      if (!isValidElement<DeclarativeSelectOptionProps>(child)) return;
      const isSelectOption = Boolean((child.type as SelectOptionComponent)[selectOptionPart]);
      if (isSelectOption && child.props.value === selected) {
        declarativeSelectedText =
          child.props.textValue ??
          resolveAutocompleteItemText(child.props.children).text ??
          child.props["aria-label"];
        return;
      }
      visitSelectOptions(child.props.children);
    });
  };
  visitSelectOptions(children);
  useFormReset({
    controlRef: selectRef,
    controlled: selectedState.controlled,
    form,
    resetValue: selectedState.resetValue,
    restoreValue: selectedState.restoreValue,
    readValue: (element) => element.value,
  });
  useEffect(() => {
    selectedRef.current = selected;
    setSelectedText(itemTextRef.current.get(selected));
  }, [selected]);
  const registerItem = (key: string, textValue: ReactNode) => {
    const current = itemTextRef.current.get(key);
    if (Object.is(current, textValue)) return;
    itemTextRef.current.set(key, textValue);
    if (key === selectedRef.current) setSelectedText(textValue);
  };
  // Option cleanup effects depend on this identity, so root renders must not
  // unregister options that are still mounted.
  const unregisterItem = useCallback((key: string) => {
    if (!itemTextRef.current.delete(key)) return;
    setSelectedText((current) => (key === selectedRef.current ? undefined : current));
  }, []);
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
    disabled: resolvedDisabled,
    selectedKey: selected,
    triggerId: controlId,
    listBoxId: `${controlId}-listbox`,
    labelId,
    descriptionId,
    selectedText: selectedText ?? declarativeSelectedText,
    setSelectedKey: setSelected,
    registerItem,
    unregisterItem,
  };

  const content = (
    <>
      <select
        ref={selectRef}
        aria-hidden="true"
        aria-labelledby={labelId}
        disabled={resolvedDisabled}
        form={form}
        name={name}
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          document.getElementById(controlId)?.focus();
        }}
        required={resolvedRequired}
        style={nativeSelectStyle}
        tabIndex={-1}
        value={selected}
      >
        <option aria-label="No selection" value="" />
        {selected && <option value={selected}>{selected}</option>}
      </select>
      {children}
    </>
  );
  const Root = as;
  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <SelectRootContext value={context}>
          {Root && Root !== Fragment ? (
            <Root
              {...props}
              ref={ref}
              id={id}
              aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
              data-disabled={dataAttr(resolvedDisabled)}
              data-invalid={dataAttr(resolvedInvalid)}
              data-placeholder={dataAttr(selected === "")}
              data-required={dataAttr(resolvedRequired)}
              data-value={selected || undefined}
            >
              {content}
            </Root>
          ) : (
            content
          )}
        </SelectRootContext>
      </PopoverContext>
    </FieldProvider>
  );
}
