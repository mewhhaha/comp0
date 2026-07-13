import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { describedBy, useFieldContext } from "../field.js";
import { dataSlot, type RefProp } from "../shared.js";

export type MeterState = {
  value: number;
  min: number;
  max: number;
  percentage: number;
};

export type MeterProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> & {
  /** Current measurement between min and max. */
  value: number;
  /** Lower bound of the range; defaults to 0. */
  min?: number | undefined;
  /** Upper bound of the range; defaults to 1. */
  max?: number | undefined;
  /** Upper bound of the low part of the range. */
  low?: number | undefined;
  /** Lower bound of the high part of the range. */
  high?: number | undefined;
  /** Value representing the ideal part of the range. */
  optimum?: number | undefined;
  children?: ReactNode | ((state: MeterState) => ReactNode);
};

export function Meter({
  children,
  high,
  id,
  low,
  max,
  min,
  optimum,
  style,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ref,
  value,
  ...props
}: MeterProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  const description = describedBy(field, ariaDescribedBy);
  const minValue = min ?? 0;
  let maxValue = max ?? 1;
  if (maxValue <= minValue) maxValue = minValue + 1;
  const resolvedValue = Math.min(Math.max(value, minValue), maxValue);
  const fraction = (resolvedValue - minValue) / (maxValue - minValue);
  const state: MeterState = {
    value: resolvedValue,
    min: minValue,
    max: maxValue,
    percentage: fraction * 100,
  };
  let content: ReactNode;
  if (typeof children === "function") content = children(state);
  else content = children;
  let labelledBy = ariaLabelledBy;
  if (ariaLabel === undefined) labelledBy = labelledBy ?? field?.labelId;

  return (
    <div
      {...props}
      ref={ref}
      id={id ?? field?.controlId}
      role="meter"
      aria-describedby={description || undefined}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-valuemax={maxValue}
      aria-valuemin={minValue}
      aria-valuenow={resolvedValue}
      data-high={high}
      data-low={low}
      data-optimum={optimum}
      data-slot={dataSlot(props, "meter")}
      data-value={resolvedValue}
      style={{ ...style, "--comp0-meter-value": `${fraction}` } as CSSProperties}
    >
      {content}
    </div>
  );
}
