import { useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { DatePickerContext } from "../internal/date-shared.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { useFormReset } from "../internal/form-control-state.js";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";

export type DatePickerProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  /** The selected date as "YYYY-MM-DD". */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected ISO date ("YYYY-MM-DD") rather than a native ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  /** Controlled or initial open state of the calendar; DatePicker owns its own popover. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
}>;

export function DatePicker({
  as,
  children,
  id,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen,
  onOpenChange,
  name,
  form,
  disabled,
  invalid,
  required,
  ...props
}: DatePickerProps) {
  const ids = useFieldIds(id);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const popover = usePopoverState({
    open,
    defaultOpen,
    onOpenChange,
    triggerId: `${ids.controlId}-trigger`,
    contentId: `${ids.controlId}-popover`,
  });
  const [dateValue, setDate, dateState] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedRequired = Boolean(required);
  const resolvedInvalid = Boolean(invalid);
  useFormReset({
    controlRef: hiddenInputRef,
    form,
    state: dateState,
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
    setValue: setDate,
    disabled: resolvedDisabled,
  };

  const Root = rootElement(as);
  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <DatePickerContext value={pickerContext}>
          <Root
            data-slot="date-picker"
            {...props}
            aria-invalid={resolvedInvalid || undefined}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-value={dateValue || undefined}
          >
            <>
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
            </>
          </Root>
        </DatePickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
