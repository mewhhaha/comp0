import { useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { FormValue } from "../internal/form-value.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import {
  ColorPickerContext,
  colorCoordinatesForValue,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  normalizeHexColorProp,
} from "./color-picker-shared.js";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { useFormReset } from "../internal/form-control-state.js";

export type ColorPickerProps = RootProps<{
  id?: string | undefined;
  children?: ReactNode | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
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
  onOpenChange,
  name,
  form,
  disabled,
  invalid,
  required,
  ...props
}: ColorPickerProps) {
  const ids = useFieldIds(id);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [normalizedValue, setColorValue, colorState] = useControllableState({
    value: value === undefined ? undefined : normalizeHexColorProp("ColorPicker", "value", value),
    defaultValue: normalizeHexColorProp("ColorPicker", "defaultValue", defaultValue) ?? "#000000",
    onChange,
  });
  const [colorCoordinates, setColorCoordinates] = useState(() => hexToHsv(normalizedValue));
  let resolvedCoordinates = colorCoordinates;
  if (hsvToHex(colorCoordinates) !== normalizedValue) {
    resolvedCoordinates = colorCoordinatesForValue(colorCoordinates, normalizedValue);
  }
  const popover = usePopoverState({
    open,
    defaultOpen,
    onOpenChange,
    triggerId: ids.controlId,
    contentId: `${ids.controlId}-popover`,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedInvalid = Boolean(invalid);
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
            data-slot="color-picker"
            {...props}
            aria-invalid={resolvedInvalid || undefined}
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
