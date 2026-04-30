import { useCallback, useMemo, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldIds } from "../field.js";
import { SelectRootContext, type RefProp } from "../shared.js";
import { type SelectProps } from "./pickers-shared.js";
export type { SelectProps } from "./pickers-shared.js";
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
      disabled: resolvedDisabled,
      open,
      selectedKey: selected,
      triggerId: controlId,
      listBoxId: `${controlId}-listbox`,
      popoverId: `${controlId}-popover`,
      labelId,
      descriptionId,
      selectedText: itemText[selected],
      setOpen,
      setSelectedKey: setSelected,
      registerItem,
      unregisterItem,
    }),
    [
      controlId,
      descriptionId,
      labelId,
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
    <FieldProvider value={fieldContext}>
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
