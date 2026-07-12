import { type CSSProperties, type MeterHTMLAttributes } from "react";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";

export type MeterProps = Omit<MeterHTMLAttributes<HTMLMeterElement>, "value" | "min" | "max"> & {
  /** Current measurement between min and max. */
  value: number;
  /** Lower bound of the range; the native default is 0. */
  min?: number | undefined;
  /** Upper bound of the range; the native default is 1. */
  max?: number | undefined;
};

export function Meter({
  id,
  value,
  min,
  max,
  style,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: MeterProps & RefProp<HTMLMeterElement>) {
  const field = useFieldContext();
  const description = describedBy(field, ariaDescribedBy);
  const minValue = min ?? 0;
  const maxValue = max ?? 1;
  let fraction = 0;
  if (maxValue > minValue) {
    fraction = Math.min(Math.max((value - minValue) / (maxValue - minValue), 0), 1);
  }

  return (
    <meter
      {...props}
      ref={ref}
      id={id ?? field?.controlId}
      value={value}
      min={min}
      max={max}
      aria-describedby={description || undefined}
      style={{ ...style, "--comp0-meter-value": `${fraction}` } as CSSProperties}
    />
  );
}
