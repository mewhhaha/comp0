import { useFieldContext } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { DateField, type DateFieldProps } from "../date-field/DateField.js";
import { useDateRangePickerContext } from "./date-range-shared.js";

export type DateRangePickerEndFieldProps = DateFieldProps;

/** The end date input. Its default aria-label is the English "End date"; pass your own translation. */
export function DateRangePickerEndField({ disabled, ...props }: DateRangePickerEndFieldProps) {
  const picker = useDateRangePickerContext("DateRangePickerEndField");
  // DateRangePicker provides a field context together with its own, which the required read above guarantees.
  const field = useFieldContext()!;
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) ariaLabel = "End date";

  return (
    <FieldProvider
      value={{
        ...field,
        controlId: picker.endFieldId,
        value: picker.value[1],
        setValue: picker.setEnd,
      }}
    >
      <DateField
        {...props}
        disabled={Boolean(disabled || picker.disabled)}
        aria-label={ariaLabel}
      />
    </FieldProvider>
  );
}
