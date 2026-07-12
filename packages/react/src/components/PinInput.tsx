import { useCallback, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { PinInputContext, type PinInputProps } from "./pin-input-shared.js";
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
  disabled,
  children,
  ref,
  ...props
}: PinInputProps & RefProp<HTMLDivElement>) {
  const [pinValue, setPinValue] = useControllableState({ value, defaultValue, onChange });
  const [fields, setFields] = useState<HTMLInputElement[]>([]);
  const resolvedDisabled = Boolean(disabled);

  // The registration identity feeds a layout-effect dependency in every
  // PinInputField; useCallback keeps it stable even where the React Compiler
  // bails out, so fields never unregister and lose their position mid-render.
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
    setPinValue(next);
    const count = fields.length;
    if (onComplete && count > 0 && next.length >= count && pinValue.length < count) {
      onComplete(next);
    }
  };

  const setCharacter = (index: number, character: string) => {
    let next = pinValue.slice(0, index) + character + pinValue.slice(index + 1);
    if (fields.length > 0) next = next.slice(0, fields.length);
    commit(next);
    focusField(index + 1);
  };

  const clearCharacter = (index: number) => {
    commit(pinValue.slice(0, index) + pinValue.slice(index + 1));
  };

  const pasteCode = (index: number, text: string) => {
    let next = pinValue.slice(0, index) + text;
    if (fields.length > 0) next = next.slice(0, fields.length);
    commit(next);
    focusField(index + text.length);
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
        {name && <input type="hidden" name={name} value={pinValue} disabled={resolvedDisabled} />}
      </div>
    </PinInputContext>
  );
}
