import { type RefProp } from "../shared.js";
import { useMemo } from "react";
import { dataAttr } from "@comp0/core";
import { FieldProvider } from "./FieldProvider.js";
import { useFieldIds, describedBy } from "./field-shared.js";
import { type FieldsetProps } from "./field-shared.js";
export type { FieldsetProps } from "./field-shared.js";
export function Fieldset({
  children,
  id,
  disabled,
  invalid,
  required,
  ref,
  ...props
}: FieldsetProps & RefProp<HTMLFieldSetElement>) {
  const ids = useFieldIds(id);
  const fieldDisabled = Boolean(disabled);
  const fieldInvalid = Boolean(invalid);
  const fieldRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = useMemo(
    () => ({
      controlId,
      descriptionId,
      errorId,
      labelId,
      disabled: fieldDisabled,
      invalid: fieldInvalid,
      required: fieldRequired,
    }),
    [fieldDisabled, fieldInvalid, fieldRequired, controlId, descriptionId, errorId, labelId],
  );
  return (
    <FieldProvider value={fieldContext}>
      <fieldset
        {...props}
        ref={ref}
        id={id}
        disabled={fieldDisabled}
        aria-describedby={describedBy({ ...ids, invalid: fieldInvalid })}
        aria-invalid={fieldInvalid || undefined}
        data-disabled={dataAttr(fieldDisabled)}
        data-invalid={dataAttr(fieldInvalid)}
        data-required={dataAttr(fieldRequired)}
      >
        {children}
      </fieldset>
    </FieldProvider>
  );
}
