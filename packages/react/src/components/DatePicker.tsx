import { Fragment, useRef, type ElementType, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import { DatePickerContext } from "./date-shared.js";
import { PopoverContext, usePopoverState } from "./overlay-shared.js";
import { ProviderRoot } from "./provider-root.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
import { visuallyHiddenInputStyle } from "./choices-shared.js";

export type DatePickerProps = Omit<
  HTMLAttributes<HTMLElement>,
  "defaultValue" | "onChange" | "onToggle"
> & {
  as?: ElementType | typeof Fragment | undefined;
  id?: string | undefined;
  /** The selected date as "YYYY-MM-DD". */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected ISO date ("YYYY-MM-DD") rather than a native ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial open state of the calendar; DatePicker owns its own popover. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
  name?: string | undefined;
  form?: string | undefined;
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
}: DatePickerProps & RefProp<HTMLElement>) {
  const ids = useFieldIds(id);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onToggle,
    triggerId: `${ids.controlId}-trigger`,
    contentId: `${ids.controlId}-popover`,
  });
  const dateState = useFormControlState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const dateValue = dateState.value;
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  useFormReset({
    controlRef: hiddenInputRef,
    controlled: dateState.controlled,
    form,
    resetValue: dateState.resetValue,
    restoreValue: dateState.restoreValue,
    readValue: (element) => element.value,
  });
  const feedback = fieldFeedback(children, resolvedInvalid);
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
    setValue: dateState.setValue,
    disabled: resolvedDisabled,
  };

  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <DatePickerContext value={pickerContext}>
          <ProviderRoot
            as={as}
            {...props}
            ref={ref}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-value={dateValue || undefined}
          >
            {children}
            <input
              ref={hiddenInputRef}
              type="date"
              aria-hidden="true"
              form={form}
              name={name}
              value={dateValue}
              disabled={resolvedDisabled}
              required={resolvedRequired}
              tabIndex={-1}
              style={visuallyHiddenInputStyle}
              onChange={() => undefined}
              onInvalid={(event) => {
                event.preventDefault();
                event.currentTarget.ownerDocument.getElementById(popover.triggerId)?.focus();
              }}
            />
          </ProviderRoot>
        </DatePickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
