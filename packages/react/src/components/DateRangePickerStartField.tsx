import { useFieldContext, FieldProvider } from "../field.js";
import { type RefProp } from "../shared.js";
import { DateField, type DateFieldProps } from "./DateField.js";
import { useDateRangePickerContext } from "./date-range-shared.js";

export type DateRangePickerStartFieldProps = DateFieldProps;

export function DateRangePickerStartField({
  disabled,
  ref,
  ...props
}: DateRangePickerStartFieldProps & RefProp<HTMLInputElement>) {
  const picker = useDateRangePickerContext("DateRangePickerStartField")!;
  const field = useFieldContext();
  if (!field) {
    throw new Error("DateRangePickerStartField must be rendered inside DateRangePicker.");
  }

  return (
    <FieldProvider
      value={{
        ...field,
        controlId: picker.startFieldId,
        value: picker.value[0],
        setValue: picker.setStart,
      }}
    >
      <DateField {...props} ref={ref} disabled={Boolean(disabled || picker.disabled)} />
    </FieldProvider>
  );
}
