import { type RefProp } from "../shared.js";
import { useState, useContext, useId } from "react";
import { dataAttr } from "@comp0/core";
import { visuallyHiddenInputStyle, RadioGroupContext } from "./choices-shared.js";
import { type RadioProps } from "./choices-shared.js";
export type { RadioProps } from "./choices-shared.js";
export function Radio({
  children,
  value,
  disabled: disabledProp,
  inputProps,
  ref,
  ...props
}: RadioProps & RefProp<HTMLLabelElement>) {
  const id = useId();
  const group = useContext(RadioGroupContext);
  const selected = group?.value === value;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const [focused, setFocused] = useState(false);
  const state = { selected, disabled, focused };

  return (
    <label
      {...props}
      ref={ref}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(focused)}
    >
      <input
        {...inputProps}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="radio"
        name={group?.name}
        value={value}
        checked={selected}
        disabled={disabled}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          setFocused(false);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (!event.defaultPrevented && event.currentTarget.checked) group?.onChange(value);
        }}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          setFocused(true);
        }}
      />
      {typeof children === "function" ? children(state) : children}
    </label>
  );
}
