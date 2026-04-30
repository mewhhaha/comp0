import { useMemo, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFieldIds } from "../field.js";
import { PickerRootContext, type RefProp } from "../shared.js";
import { DateValueContext } from "./date-time-shared.js";
import { type DatePickerProps } from "./date-time-shared.js";
export type { DatePickerProps } from "./date-time-shared.js";
export function DatePicker({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  children,
  ref,
  ...props
}: DatePickerProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(props.id);
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [open, setOpen] = useState(false);
  const valueContext = useMemo(
    () => ({ value: current, setValue: setCurrent }),
    [current, setCurrent],
  );
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
    <DateValueContext.Provider value={valueContext}>
      <PickerRootContext.Provider value={pickerContext}>
        <div
          {...props}
          ref={ref}
          role={props.role ?? "group"}
          data-open={dataAttr(open)}
          data-slot="date-picker"
          data-value={current || undefined}
        >
          {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
          {children}
        </div>
      </PickerRootContext.Provider>
    </DateValueContext.Provider>
  );
}
