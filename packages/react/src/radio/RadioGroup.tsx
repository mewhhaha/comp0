import { useId, useRef, type ComponentProps } from "react";
import { useComposedRefs, dataAttr, useControllableState } from "@comp0/core";
import { describedBy, fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { useFormReset } from "../internal/form-control-state.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { RadioGroupContext } from "./radio-shared.js";

export type RadioGroupProps = Omit<
  ComponentProps<"fieldset">,
  "value" | "defaultValue" | "onChange"
> &
  AsProp & {
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the next selected radio value rather than a native ChangeEvent. */
    onChange?: ((value: string) => void) | undefined;
    invalid?: boolean | undefined;
    required?: boolean | undefined;
  };

export function RadioGroup({
  as,
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
}: RadioGroupProps) {
  const generatedName = useId();
  const ids = useFieldIds(id);
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const [selected, setSelected, selectedState] = useControllableState({
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
      element.querySelector<HTMLInputElement>("input[type=radio]:checked")?.value ?? "",
  });

  const composedRef = useComposedRefs(fieldsetRef, ref);
  const Part = partElement(as, "fieldset");
  return (
    <FieldProvider value={fieldContext}>
      <RadioGroupContext
        value={{
          name: name ?? generatedName,
          form: props.form,
          value: selected,
          disabled,
          required: resolvedRequired,
          onChange: setSelected,
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
          {children}
        </Part>
      </RadioGroupContext>
    </FieldProvider>
  );
}
