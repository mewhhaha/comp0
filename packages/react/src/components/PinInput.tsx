import { useCallback, useRef, useState } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { PinInputContext, type PinInputProps } from "./pin-input-shared.js";
import { useFormControlState, useFormReset } from "./form-control-state.js";
export type { PinInputProps, PinInputType } from "./pin-input-shared.js";

/**
 * A one-time-code entry group. The root is a group and needs an accessible
 * name: pass aria-label (or aria-labelledby), and give each PinInputField its
 * own aria-label such as "Digit 1". Field order follows registration order,
 * kept in document position. With a name, one hidden input submits the
 * joined code.
 */
export function PinInput({
  value,
  defaultValue = "",
  onChange,
  onComplete,
  type = "numeric",
  mask,
  name,
  form,
  disabled,
  children,
  ref,
  ...props
}: PinInputProps & RefProp<HTMLDivElement>) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const pinState = useFormControlState({ value, defaultValue, onChange });
  const pinValue = pinState.value;
  const [fields, setFields] = useState<HTMLInputElement[]>([]);
  const resolvedDisabled = Boolean(disabled);
  useFormReset({
    controlRef: hiddenInputRef,
    controlled: pinState.controlled,
    form,
    resetValue: pinState.resetValue,
    restoreValue: pinState.restoreValue,
    readValue: (element) => element.value,
  });

  // The registration identity feeds a layout-effect dependency in every
  // PinInputField; useCallback keeps fields from unregistering mid-render.
  const register = useCallback((element: HTMLInputElement) => {
    setFields((current) => {
      if (current.includes(element)) return current;
      return [...current, element].sort((a, b) => {
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return -1;
      });
    });
    return () => {
      setFields((current) => current.filter((entry) => entry !== element));
    };
  }, []);

  const focusField = (index: number) => {
    if (fields.length === 0) return;
    const clamped = Math.max(0, Math.min(index, fields.length - 1));
    fields[clamped]?.focus();
  };

  const commit = (next: string) => {
    pinState.setValue(next);
    const count = fields.length;
    if (onComplete && count > 0 && next.length >= count && pinValue.length < count) {
      onComplete(next);
    }
  };

  const setCharacter = (index: number, character: string) => {
    const targetIndex = Math.min(index, pinValue.length);
    let next = pinValue.slice(0, targetIndex) + character + pinValue.slice(targetIndex + 1);
    if (fields.length > 0) next = next.slice(0, fields.length);
    commit(next);
    focusField(targetIndex + 1);
  };

  const clearCharacter = (index: number) => {
    commit(pinValue.slice(0, index) + pinValue.slice(index + 1));
  };

  const pasteCode = (index: number, text: string) => {
    const targetIndex = Math.min(index, pinValue.length);
    let next = pinValue.slice(0, targetIndex) + text;
    if (fields.length > 0) next = next.slice(0, fields.length);
    commit(next);
    focusField(targetIndex + text.length);
  };

  return (
    <PinInputContext
      value={{
        value: pinValue,
        type,
        mask: Boolean(mask),
        disabled: resolvedDisabled,
        fields,
        register,
        setCharacter,
        clearCharacter,
        pasteCode,
        focusField,
      }}
    >
      <div {...props} ref={ref} role="group" data-disabled={dataAttr(resolvedDisabled)}>
        {children}
        <input
          ref={hiddenInputRef}
          type="hidden"
          form={form}
          name={name}
          value={pinValue}
          disabled={resolvedDisabled}
        />
      </div>
    </PinInputContext>
  );
}
