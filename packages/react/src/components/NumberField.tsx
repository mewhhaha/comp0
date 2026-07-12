import { type RefProp } from "../shared.js";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { Input } from "./Input.js";
import { type NumberFieldProps } from "./range-shared.js";
export type { NumberFieldProps } from "./range-shared.js";
export function NumberField({
  children,
  id,
  name,
  value,
  defaultValue = 0,
  onChange,
  disabled,
  invalid,
  required,
  min,
  max,
  step,
  ref,
  ...props
}: NumberFieldProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const feedback = useFieldFeedback();
  const [numberValue, setNumberValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedInvalid = Boolean(invalid);
  const resolvedRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    ...feedback,
  };

  return (
    <FieldProvider value={fieldContext}>
      <div
        {...props}
        ref={ref}
        data-disabled={dataAttr(resolvedDisabled)}
        data-invalid={dataAttr(resolvedInvalid)}
        data-required={dataAttr(resolvedRequired)}
      >
        {children ?? (
          <Input
            type="number"
            value={Number.isNaN(numberValue) ? "" : numberValue}
            name={name}
            min={min}
            max={max}
            step={step}
            disabled={resolvedDisabled}
            required={resolvedRequired}
            onChange={(event) => setNumberValue(event.currentTarget.valueAsNumber)}
          />
        )}
      </div>
    </FieldProvider>
  );
}
