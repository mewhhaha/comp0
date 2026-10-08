import { useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { FormValue } from "../internal/form-value.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  ColorPickerContext,
  colorCoordinatesForValue,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
} from "./color-picker-shared.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { useFormReset } from "../internal/form-control-state.js";

export type ColorPickerProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  "aria-invalid"?: boolean | "true" | "false" | undefined;
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
}>;

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
  ...props
}: ColorPickerProps) {
  const ids = useFieldIds(id);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = normalizeHexColor(value ?? defaultValue);
  if (!initialValue) {
    throw new Error(
      `ColorPicker value "${value ?? defaultValue}" must be a three- or six-digit hex color.`,
    );
  }
  const [colorValue, setColorValue, colorState] = useControllableState({
    value: value === undefined ? undefined : normalizeHexColor(value),
    defaultValue: initialValue,
    onChange,
  });
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
    form,
    state: colorState,
    readValue: (element) => element.value,
  });
  const { controlId, descriptionId, errorId, labelId } = ids;
  const setColor = (nextColor: typeof resolvedCoordinates) => {
    setColorCoordinates(nextColor);
    setColorValue(hsvToHex(nextColor));
  };
  const setHexValue = (nextValue: string) => {
    const normalized = normalizeHexColor(nextValue);
    if (!normalized) return;
    setColorCoordinates((current) => colorCoordinatesForValue(current, normalized));
    setColorValue(normalized);
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

  const Root = rootElement(as);
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
          <Root
            {...props}
            aria-invalid={props["aria-invalid"] ?? (resolvedInvalid || undefined)}
            data-slot={dataSlot(props, "color-picker")}
            data-open={dataAttr(popover.open)}
            data-disabled={dataAttr(resolvedDisabled)}
            data-invalid={dataAttr(resolvedInvalid)}
            data-required={dataAttr(resolvedRequired)}
            data-value={normalizedValue}
          >
            <>
              {children}
              <FormValue
                ref={hiddenInputRef}
                name={name}
                form={form}
                disabled={resolvedDisabled}
                value={normalizedValue}
              />
            </>
          </Root>
        </ColorPickerContext>
      </PopoverContext>
    </FieldProvider>
  );
}
