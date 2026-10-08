import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { FieldProvider } from "./FieldProvider.js";
import { describedBy, fieldFeedback, useFieldIds } from "./field-shared.js";

export type FieldsetProps = ComponentProps<"fieldset"> &
  AsProp & {
    invalid?: boolean | undefined;
    required?: boolean | undefined;
  };

export function Fieldset({
  as,
  children,
  id,
  disabled,
  invalid,
  required,
  ...props
}: FieldsetProps) {
  const ids = useFieldIds(id);
  const fieldDisabled = Boolean(disabled);
  const fieldInvalid = Boolean(invalid);
  const feedback = fieldFeedback(children, fieldInvalid);
  const fieldRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const fieldContext = {
    controlId,
    descriptionId,
    errorId,
    labelId,
    disabled: fieldDisabled,
    invalid: fieldInvalid,
    required: fieldRequired,
    ...feedback,
  };
  const Part = partElement(as, "fieldset");
  return (
    <FieldProvider value={fieldContext}>
      <Part
        {...props}
        id={id}
        disabled={fieldDisabled}
        aria-describedby={describedBy({ ...ids, invalid: fieldInvalid, ...feedback }) || undefined}
        aria-invalid={fieldInvalid || undefined}
        data-disabled={dataAttr(fieldDisabled)}
        data-invalid={dataAttr(fieldInvalid)}
        data-required={dataAttr(fieldRequired)}
      >
        {children}
      </Part>
    </FieldProvider>
  );
}
