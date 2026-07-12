import { type RefProp } from "../shared.js";
import { useId } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { describedBy, FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { RadioGroupContext } from "./choices-shared.js";
import { type RadioGroupProps } from "./choices-shared.js";
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
  const feedback = useFieldFeedback();
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const disabled = Boolean(props.disabled);
  const resolvedInvalid = Boolean(invalid);
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

  return (
    <FieldProvider value={fieldContext}>
      <RadioGroupContext
        value={{ name: name ?? generatedName, value: selected, disabled, onChange: setSelected }}
      >
        <fieldset
          {...props}
          ref={ref}
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
