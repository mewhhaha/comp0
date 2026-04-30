import { useMemo } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldIds } from "../field.js";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { type TextFieldProps } from "./text-field-shared.js";
export type { TextFieldProps } from "./text-field-shared.js";
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
  const { controlId, descriptionId, errorId, labelId } = ids;
  const providerValue = useMemo(
    () => ({
      controlId,
      descriptionId,
      errorId,
      labelId,
      disabled: resolvedDisabled,
      invalid: resolvedInvalid,
      required: resolvedRequired,
      value: controlsValue ? fieldValue : undefined,
      setValue: controlsValue ? setFieldValue : undefined,
    }),
    [
      controlsValue,
      controlId,
      descriptionId,
      errorId,
      fieldValue,
      labelId,
      resolvedDisabled,
      resolvedInvalid,
      resolvedRequired,
      setFieldValue,
    ],
  );

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
