import { type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";

/** The props a text field owns; roots built on TextField extend this and wrap it in `RootProps`. */
export type TextFieldOwnProps = {
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next field value, rather than a native ChangeEvent from the provider root. */
  onChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  children?: ReactNode | undefined;
};

export type TextFieldProps = RootProps<TextFieldOwnProps>;

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
  ...props
}: TextFieldProps) {
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
  const [fieldValue, setField, fieldState] = useControllableState({
    value: resolvedValue,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const { characterCountId, controlId, descriptionId, errorId, labelId } = ids;
  const providerValue = {
    controlId,
    characterCountId,
    descriptionId,
    errorId,
    labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    textControl: true as const,
    value: controlsValue ? fieldValue : undefined,
    setValue: controlsValue ? setField : undefined,
    valueState: controlsValue ? fieldState : undefined,
    ...feedback,
  };

  const Root = rootElement(as);
  return (
    <FieldProvider value={providerValue}>
      <Root
        {...props}
        aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-invalid={dataAttr(resolvedInvalid)}
        data-required={dataAttr(resolvedRequired)}
      >
        {children}
      </Root>
    </FieldProvider>
  );
}
