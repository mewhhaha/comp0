import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { dataSlot, type RefProp } from "../shared.js";

export type ProgressBarState = {
  value: number | undefined;
  max: number;
  percentage: number | undefined;
};

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> & {
  /** Completed amount between 0 and max; omit it for an indeterminate bar. */
  value?: number | undefined;
  /** Upper bound of the range; defaults to 1. */
  max?: number | undefined;
  children?: ReactNode | ((state: ProgressBarState) => ReactNode);
};

export function ProgressBar({
  children,
  id,
  max,
  style,
  value,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: ProgressBarProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  const description = describedBy(field, ariaDescribedBy);
  const maxValue = max !== undefined && max > 0 ? max : 1;
  const indeterminate = value === undefined;
  let resolvedValue: number | undefined;
  let percentage: number | undefined;
  let progressStyle = style;
  if (value !== undefined) {
    resolvedValue = Math.min(Math.max(value, 0), maxValue);
    const fraction = resolvedValue / maxValue;
    percentage = fraction * 100;
    progressStyle = { ...style, "--comp0-progress-value": `${fraction}` } as CSSProperties;
  }
  const state: ProgressBarState = { value: resolvedValue, max: maxValue, percentage };
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
      role="progressbar"
      aria-describedby={description || undefined}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-valuemax={maxValue}
      aria-valuemin={0}
      aria-valuenow={resolvedValue}
      data-indeterminate={dataAttr(indeterminate)}
      data-slot={dataSlot(props, "progress-bar")}
      data-value={resolvedValue}
      style={progressStyle}
    >
      {content}
    </div>
  );
}
