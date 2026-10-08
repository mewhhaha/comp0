import { useFieldContext } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { DateField, type DateFieldProps } from "../date-field/DateField.js";
import { useDateRangePickerContext } from "./date-range-shared.js";

export type DateRangePickerStartFieldProps = DateFieldProps;

export function DateRangePickerStartField({ disabled, ...props }: DateRangePickerStartFieldProps) {
  const picker = useDateRangePickerContext("DateRangePickerStartField");
  // DateRangePicker provides a field context together with its own, which the required read above guarantees.
  const field = useFieldContext()!;

  return (
    <FieldProvider
      value={{
        ...field,
        controlId: picker.startFieldId,
        value: picker.value[0],
        setValue: picker.setStart,
      }}
    >
      <DateField {...props} disabled={Boolean(disabled || picker.disabled)} />
    </FieldProvider>
  );
}
