import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import { ProviderRoot } from "./provider-root.js";
import { type TextFieldProps } from "./text-field-shared.js";
export type { TextFieldProps } from "./text-field-shared.js";
export function TextField({
  as,
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
}: TextFieldProps & RefProp<HTMLElement>) {
  const ids = useFieldIds(id);
  const feedback = useFieldFeedback();
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
  const providerValue = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    value: controlsValue ? fieldValue : undefined,
    setValue: controlsValue ? setFieldValue : undefined,
    ...feedback,
  };

  return (
    <FieldProvider value={providerValue}>
      <ProviderRoot
        as={as}
        {...props}
        ref={ref}
        aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-invalid={dataAttr(resolvedInvalid)}
        data-required={dataAttr(resolvedRequired)}
      >
        {children}
      </ProviderRoot>
    </FieldProvider>
  );
}
