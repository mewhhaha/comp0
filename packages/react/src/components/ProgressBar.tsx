import { type CSSProperties, type ProgressHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";

export type ProgressBarProps = Omit<
  ProgressHTMLAttributes<HTMLProgressElement>,
  "value" | "max"
> & {
  /** Completed amount between 0 and max; omit it for an indeterminate bar. */
  value?: number | undefined;
  /** Upper bound of the range; the native default is 1. */
  max?: number | undefined;
};

export function ProgressBar({
  id,
  value,
  max,
  style,
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}: ProgressBarProps & RefProp<HTMLProgressElement>) {
  const field = useFieldContext();
  const description = describedBy(field, ariaDescribedBy);
  const indeterminate = value === undefined;
  let progressStyle = style;
  if (value !== undefined) {
    const maxValue = max ?? 1;
    let fraction = 0;
    if (maxValue > 0) fraction = Math.min(Math.max(value / maxValue, 0), 1);
    progressStyle = { ...style, "--comp0-progress-value": `${fraction}` } as CSSProperties;
  }

  return (
    <progress
      {...props}
      ref={ref}
      id={id ?? field?.controlId}
      value={value}
      max={max}
      aria-describedby={description || undefined}
      data-indeterminate={dataAttr(indeterminate)}
      style={progressStyle}
    />
  );
}
