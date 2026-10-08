import { useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { DateRangePickerContext, type DateRange } from "./date-range-shared.js";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";
import { useFormReset } from "../internal/form-control-state.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";

export type DateRangePickerProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
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
}>;

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
  ...props
}: DateRangePickerProps) {
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
  const [range, setRange, rangeState] = useControllableState<DateRange>({
    value,
    defaultValue: defaultValue ?? ["", ""],
    onChange,
  });
  const [start, end] = range;
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  useFormReset({
    controlRef: startInputRef,
    form,
    state: rangeState,
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
    setRange((current) => {
      if (current[0] === nextStart) return current;
      return [nextStart, current[1]];
    });
  };
  const setEnd = (nextEnd: string) => {
    setRange((current) => {
      if (current[1] === nextEnd) return current;
      return [current[0], nextEnd];
    });
  };
  const focusTriggerOnInvalid = (event: React.InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.currentTarget.ownerDocument.getElementById(popover.triggerId)?.focus();
  };

  const Root = rootElement(as);
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
            setValue: setRange,
          }}
        >
          <Root
            {...props}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-slot={dataSlot(props, "date-range-picker")}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-complete={dataAttr(Boolean(start && end))}
            data-start-value={start || undefined}
            data-end-value={end || undefined}
          >
            <>
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
            </>
          </Root>
        </DateRangePickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
