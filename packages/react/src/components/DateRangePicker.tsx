import { useMemo, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFieldIds } from "../field.js";
import { PickerRootContext, type RefProp } from "../shared.js";
import { DateRangeValueContext } from "./date-time-shared.js";
import { type DateRangePickerProps } from "./date-time-shared.js";
export type { DateRangePickerProps } from "./date-time-shared.js";
export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  children,
  ref,
  ...props
}: DateRangePickerProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(props.id);
  const [range, setRange] = useControllableState({
    value,
    defaultValue: defaultValue ?? { start: "", end: "" },
    onChange,
  });
  const [open, setOpen] = useState(false);
  const valueContext = useMemo(() => ({ value: range, setValue: setRange }), [range, setRange]);
  const pickerContext = useMemo(
    () => ({
      disabled: Boolean(disabled),
      open,
      triggerId: `${ids.controlId}-trigger`,
      popoverId: `${ids.controlId}-popover`,
      setOpen,
    }),
    [disabled, ids.controlId, open],
  );
  return (
    <DateRangeValueContext.Provider value={valueContext}>
      <PickerRootContext.Provider value={pickerContext}>
        <div
          {...props}
          ref={ref}
          role={props.role ?? "group"}
          data-open={dataAttr(open)}
          data-slot="date-range-picker"
          data-start-value={range.start || undefined}
          data-end-value={range.end || undefined}
        >
          {name && (
            <>
              <input type="hidden" name={`${name}-start`} value={range.start} disabled={disabled} />
              <input type="hidden" name={`${name}-end`} value={range.end} disabled={disabled} />
            </>
          )}
          {children}
        </div>
      </PickerRootContext.Provider>
    </DateRangeValueContext.Provider>
  );
}
