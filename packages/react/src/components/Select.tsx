import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { PickerRootContext, SelectRootContext, type RefProp } from "../shared.js";
import { type SelectProps } from "./pickers-shared.js";
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

export function Select({
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  name,
  as,
  children,
  ref,
  ...props
}: SelectProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const feedback = useFieldFeedback();
  const itemTextRef = useRef(new Map<string, ReactNode>());
  const selectedRef = useRef("");
  const [selectedText, setSelectedText] = useState<ReactNode>();
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
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
    selectedText,
    setSelectedKey: setSelected,
    registerItem,
    unregisterItem,
  };

  const content = (
    <>
      {(name || resolvedRequired) && (
        <select
          aria-hidden="true"
          aria-labelledby={labelId}
          disabled={resolvedDisabled}
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
      )}
      {children}
    </>
  );
  const Root = as;
  return (
    <FieldProvider value={fieldContext}>
      <PickerRootContext
        value={{
          disabled: resolvedDisabled,
          triggerId: controlId,
          listBoxId: `${controlId}-listbox`,
        }}
      >
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
      </PickerRootContext>
    </FieldProvider>
  );
}
