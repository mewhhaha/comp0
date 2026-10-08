import { useEffect, useRef, useState, type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataAttr, useControllableState } from "@comp0/core";
import { fieldFeedback, useFieldIds } from "../field/field-shared.js";
import { FieldProvider } from "../field/FieldProvider.js";
import { NumberFieldInput } from "./NumberFieldInput.js";
import { NumberFieldContext } from "./number-field-shared.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type NumberFieldProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    id?: string | undefined;
    name?: string | undefined;
    value?: number | undefined;
    defaultValue?: number | undefined;
    onChange?: ((value: number) => void) | undefined;
    disabled?: boolean | undefined;
    invalid?: boolean | undefined;
    required?: boolean | undefined;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
  };

export function NumberField({
  as,
  children,
  id,
  name,
  value,
  defaultValue = 0,
  onChange,
  disabled,
  invalid,
  required,
  min,
  max,
  step,
  ...props
}: NumberFieldProps) {
  const ids = useFieldIds(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [announcement, setAnnouncement] = useState("");
  const [numberValue, setNumber, numberState] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedInvalid = Boolean(invalid);
  const feedback = fieldFeedback(children, resolvedInvalid);
  const resolvedRequired = Boolean(required);
  const { controlId, descriptionId, errorId, labelId } = ids;
  const announceValue = (nextAnnouncement: string) => {
    clearTimeout(announcementTimerRef.current);
    setAnnouncement(nextAnnouncement);
    announcementTimerRef.current = setTimeout(() => setAnnouncement(""), 2000);
  };

  useEffect(() => () => clearTimeout(announcementTimerRef.current), []);

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

  const Part = partElement(as, "div");
  return (
    <NumberFieldContext
      value={{
        controlId,
        disabled: resolvedDisabled,
        inputRef,
        max,
        min,
        name,
        required: resolvedRequired,
        step,
        value: numberValue,
        announceValue,
        setValue: setNumber,
        valueState: numberState,
      }}
    >
      <FieldProvider value={fieldContext}>
        <Part
          {...props}
          data-disabled={dataAttr(resolvedDisabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          <>
            {children ?? <NumberFieldInput />}
            <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
              {announcement}
            </output>
          </>
        </Part>
      </FieldProvider>
    </NumberFieldContext>
  );
}
