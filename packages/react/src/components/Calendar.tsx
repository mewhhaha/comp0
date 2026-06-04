import { useCallback, useContext, useState, type KeyboardEvent } from "react";
import { useControllableState } from "@comp0/core";
import { InteractiveDiv, PickerRootContext, type RefProp } from "../shared.js";
import {
  isoDate,
  parseDate,
  addDays,
  addMonths,
  CalendarGridView,
  DateValueContext,
} from "./date-time-shared.js";
import { type CalendarProps } from "./date-time-shared.js";
export type { CalendarProps } from "./date-time-shared.js";
export function Calendar({
  value,
  defaultValue,
  onChange,
  focusedValue,
  isDateDisabled,
  isDateUnavailable,
  children,
  onKeyDown,
  ref,
  ...props
}: CalendarProps & RefProp<HTMLDivElement>) {
  const datePicker = useContext(DateValueContext);
  const picker = useContext(PickerRootContext);
  const controlledValue = value ?? datePicker?.value;
  const handleChange = useCallback(
    (next: string) => {
      datePicker?.setValue(next);
      onChange?.(next);
      if (datePicker) picker?.setOpen(false);
    },
    [datePicker, onChange, picker],
  );
  const [selected, setSelected] = useControllableState({
    value: controlledValue,
    defaultValue: defaultValue ?? "",
    onChange: handleChange,
  });
  const [focused, setFocused] = useState(
    parseDate(focusedValue) ?? parseDate(selected) ?? new Date(),
  );
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>, next: Date) => {
    event.preventDefault();
    setFocused(next);
  };

  return (
    <InteractiveDiv
      {...props}
      ref={ref}
      role={props.role ?? "group"}
      data-slot="calendar"
      data-value={selected || undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowRight") moveFocus(event, addDays(focused, 1));
        else if (event.key === "ArrowLeft") moveFocus(event, addDays(focused, -1));
        else if (event.key === "ArrowDown") moveFocus(event, addDays(focused, 7));
        else if (event.key === "ArrowUp") moveFocus(event, addDays(focused, -7));
        else if (event.key === "PageDown") moveFocus(event, addMonths(focused, 1));
        else if (event.key === "PageUp") moveFocus(event, addMonths(focused, -1));
        else if (event.key === "Home") moveFocus(event, addDays(focused, -focused.getDay()));
        else if (event.key === "End") moveFocus(event, addDays(focused, 6 - focused.getDay()));
        else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const next = isoDate(focused);
          if (!isDateDisabled?.(next) && !isDateUnavailable?.(next)) setSelected(next);
        }
      }}
    >
      {children ?? (
        <CalendarGridView
          focused={focused}
          isSelected={(value) => selected === value}
          isDateDisabled={isDateDisabled}
          isDateUnavailable={isDateUnavailable}
          select={setSelected}
          focus={setFocused}
        />
      )}
    </InteractiveDiv>
  );
}
