import { Fragment, useRef, useState, type ElementType, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { type RefProp } from "../shared.js";
import {
  ColorPickerContext,
  colorCoordinatesForValue,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
} from "./color-picker-shared.js";
import { PopoverContext, usePopoverState } from "./overlay-shared.js";
import { ProviderRoot } from "./provider-root.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";

export type ColorPickerProps = Omit<
  HTMLAttributes<HTMLElement>,
  "defaultValue" | "onChange" | "onToggle"
> & {
  as?: ElementType | typeof Fragment | undefined;
  id?: string | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onToggle?: ((open: boolean) => void) | undefined;
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function ColorPicker({
  as,
  children,
  id,
  value,
  defaultValue = "#000000",
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
}: ColorPickerProps & RefProp<HTMLElement>) {
  const ids = useFieldIds(id);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = normalizeHexColor(value ?? defaultValue);
  if (!initialValue) {
    throw new Error(
      `ColorPicker value "${value ?? defaultValue}" must be a three- or six-digit hex color.`,
    );
  }
  const colorState = useFormControlState({
    value: value === undefined ? undefined : normalizeHexColor(value),
    defaultValue: initialValue,
    onChange,
  });
  const colorValue = colorState.value;
  const normalizedValue = normalizeHexColor(colorValue);
  if (!normalizedValue) {
    throw new Error(`ColorPicker value "${colorValue}" must be a three- or six-digit hex color.`);
  }
  const [colorCoordinates, setColorCoordinates] = useState(() => hexToHsv(normalizedValue));
  let resolvedCoordinates = colorCoordinates;
  if (hsvToHex(colorCoordinates) !== normalizedValue) {
    resolvedCoordinates = colorCoordinatesForValue(colorCoordinates, normalizedValue);
  }
  const popover = usePopoverState({
    open,
    defaultOpen,
    onToggle,
    triggerId: ids.controlId,
    contentId: `${ids.controlId}-popover`,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedInvalid =
    props["aria-invalid"] === true || props["aria-invalid"] === "true" || Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const resolvedRequired = Boolean(required);
  useFormReset({
    controlRef: hiddenInputRef,
    controlled: colorState.controlled,
    form,
    resetValue: colorState.resetValue,
    restoreValue: colorState.restoreValue,
    readValue: (element) => element.value,
  });
  const { controlId, descriptionId, errorId, labelId } = ids;
  const setColor = (nextColor: typeof resolvedCoordinates) => {
    setColorCoordinates(nextColor);
    colorState.setValue(hsvToHex(nextColor));
  };
  const setHexValue = (nextValue: string) => {
    const normalized = normalizeHexColor(nextValue);
    if (!normalized) return;
    setColorCoordinates((current) => colorCoordinatesForValue(current, normalized));
    colorState.setValue(normalized);
  };
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

  return (
    <FieldProvider value={fieldContext}>
      <PopoverContext value={popover}>
        <ColorPickerContext
          value={{
            color: resolvedCoordinates,
            controlId,
            disabled: resolvedDisabled,
            inputId: `${controlId}-input`,
            value: normalizedValue,
            setColor,
            setValue: setHexValue,
          }}
        >
          <ProviderRoot
            as={as}
            {...props}
            ref={ref}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-open={dataAttr(popover.open)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-value={normalizedValue}
          >
            {children}
            <input
              ref={hiddenInputRef}
              type="hidden"
              form={form}
              name={name}
              value={normalizedValue}
              disabled={resolvedDisabled}
            />
          </ProviderRoot>
        </ColorPickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
