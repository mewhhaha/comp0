import { type RefProp } from "../shared.js";
import { useId, useRef } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { describedBy, fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { RadioGroupContext } from "./choices-shared.js";
import { type RadioGroupProps } from "./choices-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
export type { RadioGroupProps } from "./choices-shared.js";
export function RadioGroup({
  children,
  id,
  value,
  defaultValue = "",
  onChange,
  invalid,
  required,
  name,
  ref,
  ...props
}: RadioGroupProps & RefProp<HTMLFieldSetElement>) {
  const generatedName = useId();
  const ids = useFieldIds(id);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const selectedState = useFormControlState({
    value,
    defaultValue,
    onChange,
  });
  const selected = selectedState.value;
  const disabled = Boolean(props.disabled);
  const resolvedInvalid = Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const resolvedRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    ...feedback,
  };
  useFormReset({
    controlRef: fieldsetRef,
    controlled: selectedState.controlled,
    form: props.form,
    resetValue: selectedState.resetValue,
    restoreValue: selectedState.restoreValue,
    readValue: (element) =>
      element.querySelector<HTMLInputElement>("input[type=radio]:checked")?.value ?? "",
  });

  return (
    <FieldProvider value={fieldContext}>
      <RadioGroupContext
        value={{
          name: name ?? generatedName,
          form: props.form,
          value: selected,
          disabled,
          required: resolvedRequired,
          onChange: selectedState.setValue,
        }}
      >
        <fieldset
          {...props}
          ref={composeRefs(fieldsetRef, ref)}
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={
            describedBy({ ...ids, invalid: resolvedInvalid, ...feedback }) || undefined
          }
          aria-invalid={resolvedInvalid || undefined}
          data-disabled={dataAttr(disabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          {children}
        </fieldset>
      </RadioGroupContext>
    </FieldProvider>
  );
}
