import { useRef, type ComponentProps } from "react";
import { useComposedRefs, dataAttr, useControllableState } from "@comp0/core";
import { describedBy, fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";
import { useFormReset } from "../internal/form-control-state.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { CheckboxGroupContext } from "./checkbox-shared.js";

export type CheckboxGroupProps = Omit<
  ComponentProps<"fieldset">,
  "value" | "defaultValue" | "onChange"
> &
  AsProp & {
    value?: string[] | undefined;
    defaultValue?: string[] | undefined;
    /** Receives the next selected-value array rather than a native ChangeEvent. */
    onChange?: ((value: string[]) => void) | undefined;
    invalid?: boolean | undefined;
    required?: boolean | undefined;
  };

export function CheckboxGroup({
  as,
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
}: CheckboxGroupProps) {
  const ids = useFieldIds(id);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const [selectedValues, setSelected, selectedState] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
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
    form: props.form,
    state: selectedState,
    readValue: (element) =>
      [...element.querySelectorAll<HTMLInputElement>("input[data-checkbox-group-control]")]
        .filter((input) => input.checked)
        .map((input) => input.value),
  });

  const composedRef = useComposedRefs(fieldsetRef, ref);
  const Part = partElement(as, "fieldset");
  return (
    <FieldProvider value={fieldContext}>
      <CheckboxGroupContext
        value={{
          name,
          form: props.form,
          value: selectedValues,
          disabled,
          onChange(nextValue, selected) {
            setSelected((current) => {
              if (selected) return [...new Set([...current, nextValue])];
              return current.filter((item) => item !== nextValue);
            });
          },
        }}
      >
        <Part
          {...props}
          ref={composedRef}
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
          <>
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
          </>
        </Part>
      </CheckboxGroupContext>
    </FieldProvider>
  );
}
