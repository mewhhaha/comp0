import { type RefProp } from "../shared.js";
import { useRef } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { describedBy, fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { CheckboxGroupContext, visuallyHiddenInputStyle } from "./choices-shared.js";
import { type CheckboxGroupProps } from "./choices-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
export type { CheckboxGroupProps } from "./choices-shared.js";
export function CheckboxGroup({
  children,
  id,
  value,
  defaultValue = [],
  onChange,
  invalid,
  required,
  name,
  ref,
  ...props
}: CheckboxGroupProps & RefProp<HTMLFieldSetElement>) {
  const ids = useFieldIds(id);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const selectedState = useFormControlState({
    value,
    defaultValue,
    onChange,
  });
  const selectedValues = selectedState.value;
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
      [...element.querySelectorAll<HTMLInputElement>("input[data-checkbox-group-control]")]
        .filter((input) => input.checked)
        .map((input) => input.value),
  });

  return (
    <FieldProvider value={fieldContext}>
      <CheckboxGroupContext
        value={{
          name,
          form: props.form,
          value: selectedValues,
          disabled,
          onChange(nextValue, selected) {
            selectedState.setValue((current) => {
              if (selected) return [...new Set([...current, nextValue])];
              return current.filter((item) => item !== nextValue);
            });
          },
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
          {resolvedRequired && (
            <input
              aria-hidden="true"
              checked={selectedValues.length > 0}
              data-checkbox-group-validity=""
              form={props.form}
              onInvalid={(event) => {
                event.preventDefault();
                fieldsetRef.current
                  ?.querySelector<HTMLInputElement>("input[data-checkbox-group-control]")
                  ?.focus();
              }}
              readOnly
              required
              style={visuallyHiddenInputStyle}
              tabIndex={-1}
              type="checkbox"
            />
          )}
          {children}
        </fieldset>
      </CheckboxGroupContext>
    </FieldProvider>
  );
}
