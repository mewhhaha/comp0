import { type RefProp } from "../shared.js";
import { useMemo } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { parseColor, serializeColor, ColorContext } from "./color-shared.js";
import { type Hsva, type ColorFieldProps } from "./color-shared.js";
export type { ColorFieldProps } from "./color-shared.js";
export function ColorField({
  value,
  defaultValue = "#000000",
  onChange,
  name,
  disabled,
  children,
  ref,
  ...props
}: ColorFieldProps & RefProp<HTMLDivElement>) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange });
  const parsed = parseColor(current);
  const context = useMemo(
    () => ({
      value: current,
      color: parsed ?? { h: 0, s: 0, v: 0, a: 1 },
      invalid: !parsed,
      setValue: setCurrent,
      setColor(color: Hsva) {
        setCurrent(serializeColor(color));
      },
    }),
    [current, parsed, setCurrent],
  );

  return (
    <ColorContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role={props.role ?? "group"}
        aria-disabled={disabled || undefined}
        aria-invalid={!parsed || undefined}
        data-disabled={dataAttr(disabled)}
        data-invalid={dataAttr(!parsed)}
        data-slot="color-field"
        data-value={current}
      >
        {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
        {children}
      </div>
    </ColorContext.Provider>
  );
}
