import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { ProviderRoot } from "./provider-root.js";
import { useFormControlState } from "./form-control-state.js";
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
  const autocomplete = useAutocompleteContext();
  const ids = useFieldIds(id);
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const resolvedValue = value ?? autocomplete?.inputValue;
  const controlsValue =
    resolvedValue !== undefined || defaultValue !== undefined || onChange !== undefined;
  const fieldState = useFormControlState({
    value: resolvedValue,
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
    value: controlsValue ? fieldState.value : undefined,
    setValue: controlsValue ? fieldState.setValue : undefined,
    valueControlled: controlsValue ? fieldState.controlled : undefined,
    resetValue: controlsValue ? fieldState.resetValue : undefined,
    restoreValue: controlsValue ? fieldState.restoreValue : undefined,
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
