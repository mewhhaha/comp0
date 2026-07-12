import { Fragment, type ElementType, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldFeedback, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import { DatePickerContext } from "./date-shared.js";
import { ProviderRoot } from "./provider-root.js";

export type DatePickerProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  id?: string | undefined;
  /** The selected date as "YYYY-MM-DD". */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected ISO date ("YYYY-MM-DD") rather than a native ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function DatePicker({
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
}: DatePickerProps & RefProp<HTMLElement>) {
  const ids = useFieldIds(id);
  const feedback = useFieldFeedback();
  const [dateValue, setDateValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
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
  const pickerContext = {
    value: dateValue,
    setValue: setDateValue,
    disabled: resolvedDisabled,
  };

  return (
    <FieldProvider value={fieldContext}>
      <DatePickerContext value={pickerContext}>
        <ProviderRoot
          as={as}
          {...props}
          ref={ref}
          id={id}
          aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
          data-disabled={dataAttr(resolvedDisabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
          data-value={dateValue || undefined}
        >
          {children}
        </ProviderRoot>
      </DatePickerContext>
    </FieldProvider>
  );
}
