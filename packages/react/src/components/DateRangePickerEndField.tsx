import { useFieldContext, FieldProvider } from "../field.js";
import { type RefProp } from "../shared.js";
import { DateField, type DateFieldProps } from "./DateField.js";
import { useDateRangePickerContext } from "./date-range-shared.js";

export type DateRangePickerEndFieldProps = DateFieldProps;

/** The end date input. Its default aria-label is the English "End date"; pass your own translation. */
export function DateRangePickerEndField({
  disabled,
  ref,
  ...props
}: DateRangePickerEndFieldProps & RefProp<HTMLInputElement>) {
  const picker = useDateRangePickerContext("DateRangePickerEndField")!;
  const field = useFieldContext();
  if (!field) {
    throw new Error("DateRangePickerEndField must be rendered inside DateRangePicker.");
  }
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
        ref={ref}
        disabled={Boolean(disabled || picker.disabled)}
        aria-label={ariaLabel}
      />
    </FieldProvider>
  );
}
