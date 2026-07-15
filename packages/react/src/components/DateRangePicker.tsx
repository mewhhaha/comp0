import { Fragment, useRef, type ElementType, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import { DateRangePickerContext, type DateRange } from "./date-range-shared.js";
import { visuallyHiddenInputStyle } from "./choices-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
import { PopoverContext, usePopoverState } from "./overlay-shared.js";
import { ProviderRoot } from "./provider-root.js";

export type DateRangePickerProps = Omit<
  HTMLAttributes<HTMLElement>,
  "defaultValue" | "onChange" | "onToggle"
> & {
  as?: ElementType | typeof Fragment | undefined;
  id?: string | undefined;
  /** The selected [start, end] dates as "YYYY-MM-DD" strings. */
  value?: DateRange | undefined;
  defaultValue?: DateRange | undefined;
  /** Receives the selected [start, end] ISO dates rather than a native ChangeEvent. */
  onChange?: ((value: DateRange) => void) | undefined;
  /** Controlled or initial open state of the calendar; DateRangePicker owns its own popover. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
  /** Submits two date inputs named `${name}-start` and `${name}-end`. */
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function DateRangePicker({
  as,
  children,
  id,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen,
  onToggle,
  name,
  form,
  disabled,
  invalid,
  required,
  ref,
  ...props
}: DateRangePickerProps & RefProp<HTMLElement>) {
  const ids = useFieldIds(id);
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onToggle,
    triggerId: `${ids.controlId}-trigger`,
    contentId: `${ids.controlId}-popover`,
  });
  const rangeState = useFormControlState<DateRange>({
    value,
    defaultValue: defaultValue ?? ["", ""],
    onChange,
  });
  const range = rangeState.value;
  const [start, end] = range;
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  useFormReset({
    controlRef: startInputRef,
    controlled: rangeState.controlled,
    form,
    resetValue: rangeState.resetValue,
    restoreValue: rangeState.restoreValue,
    readValue: (element): DateRange => [element.value, endInputRef.current?.value ?? end],
  });
  const feedback = fieldFeedback(children, resolvedInvalid);
  const startFieldId = `${ids.controlId}-start`;
  const endFieldId = `${ids.controlId}-end`;
  const fieldContext = {
    controlId: startFieldId,
    descriptionId: ids.descriptionId,
    errorId: ids.errorId,
    labelId: ids.labelId,
    disabled: resolvedDisabled,
    invalid: resolvedInvalid,
    required: resolvedRequired,
    ...feedback,
  };
  const setStart = (nextStart: string) => {
    rangeState.setValue((current) => {
      if (current[0] === nextStart) return current;
      return [nextStart, current[1]];
    });
  };
  const setEnd = (nextEnd: string) => {
    rangeState.setValue((current) => {
      if (current[1] === nextEnd) return current;
      return [current[0], nextEnd];
    });
  };
  const focusTriggerOnInvalid = (event: React.InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.currentTarget.ownerDocument.getElementById(popover.triggerId)?.focus();
  };

  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <DateRangePickerContext
          value={{
            value: range,
            startFieldId,
            endFieldId,
            disabled: resolvedDisabled,
            setStart,
            setEnd,
            setValue: rangeState.setValue,
          }}
        >
          <ProviderRoot
            as={as}
            {...props}
            ref={ref}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-complete={dataAttr(Boolean(start && end))}
            data-start-value={start || undefined}
            data-end-value={end || undefined}
          >
            {children}
            <input
              ref={startInputRef}
              type="date"
              aria-hidden="true"
              form={form}
              name={name ? `${name}-start` : undefined}
              value={start}
              disabled={resolvedDisabled}
              required={resolvedRequired}
              tabIndex={-1}
              style={visuallyHiddenInputStyle}
              onChange={() => undefined}
              onInvalid={focusTriggerOnInvalid}
            />
            <input
              ref={endInputRef}
              type="date"
              aria-hidden="true"
              form={form}
              name={name ? `${name}-end` : undefined}
              value={end}
              disabled={resolvedDisabled}
              required={resolvedRequired}
              tabIndex={-1}
              style={visuallyHiddenInputStyle}
              onChange={() => undefined}
              onInvalid={focusTriggerOnInvalid}
            />
          </ProviderRoot>
        </DateRangePickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
