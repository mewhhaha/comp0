import { useEffect, useRef, useState } from "react";
import { type RefProp } from "../shared.js";
import { dataAttr } from "@comp0/core";
import { fieldFeedback, FieldProvider, useFieldIds } from "../field.js";
import { NumberFieldInput } from "./NumberFieldInput.js";
import { NumberFieldContext, type NumberFieldProps } from "./range-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";
import { useFormControlState } from "./form-control-state.js";
export type { NumberFieldProps } from "./range-shared.js";
export function NumberField({
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
  ref,
  ...props
}: NumberFieldProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [announcement, setAnnouncement] = useState("");
  const numberState = useFormControlState({
    value,
    defaultValue,
    onChange,
  });
  const numberValue = numberState.value;
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
        controlled: numberState.controlled,
        announceValue,
        setValue: numberState.setValue,
        resetValue: numberState.resetValue,
        restoreValue: numberState.restoreValue,
      }}
    >
      <FieldProvider value={fieldContext}>
        <div
          {...props}
          ref={ref}
          data-disabled={dataAttr(resolvedDisabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          {children ?? <NumberFieldInput />}
          <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
            {announcement}
          </output>
        </div>
      </FieldProvider>
    </NumberFieldContext>
  );
}
