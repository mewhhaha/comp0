import { useEffect, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { normalizeHexColor, useColorPickerContext } from "./color-picker-shared.js";

export type ColorPickerInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "disabled" | "name"
> & {
  disabled?: boolean | undefined;
};

export function ColorPickerInput({
  autoCapitalize,
  disabled,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  ref,
  spellCheck,
  ...props
}: ColorPickerInputProps & RefProp<HTMLInputElement>) {
  const colorPicker = useColorPickerContext("ColorPickerInput");
  const [draft, setDraft] = useState(colorPicker.value);
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const previousValueRef = useRef(colorPicker.value);
  const resolvedDisabled = Boolean(disabled || colorPicker.disabled);
  const normalizedDraft = normalizeHexColor(draft);

  useEffect(() => {
    const valueChanged = previousValueRef.current !== colorPicker.value;
    if (focused || (!valueChanged && invalid)) return;
    previousValueRef.current = colorPicker.value;
    setDraft(colorPicker.value);
    if (valueChanged) setInvalid(false);
  }, [colorPicker.value, focused, invalid]);

  const commit = () => {
    if (!normalizedDraft) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    colorPicker.setValue(normalizedDraft);
  };

  return (
    <input
      {...props}
      ref={ref}
      id={props.id ?? colorPicker.inputId}
      type="text"
      value={draft}
      disabled={resolvedDisabled}
      aria-invalid={props["aria-invalid"] ?? (invalid || undefined)}
      aria-label={props["aria-label"] ?? "Hex color"}
      autoCapitalize={autoCapitalize ?? "none"}
      spellCheck={spellCheck ?? false}
      data-disabled={dataAttr(resolvedDisabled)}
      data-invalid={dataAttr(invalid)}
      data-value={draft || undefined}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) setFocused(true);
      }}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        const nextDraft = event.currentTarget.value;
        setDraft(nextDraft);
        setInvalid(false);
        const normalized = normalizeHexColor(nextDraft);
        if (normalized) colorPicker.setValue(normalized);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (event.defaultPrevented) return;
        commit();
        setFocused(false);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
          event.currentTarget.select();
        }
        if (event.key === "Escape" && draft !== colorPicker.value) {
          event.preventDefault();
          setDraft(colorPicker.value);
          setInvalid(false);
        }
      }}
    />
  );
}
