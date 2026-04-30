import { type RefProp } from "../shared.js";
import { type CSSProperties } from "react";
import { dataAttr } from "@comp0/core";
import { type ProgressBarProps } from "./range-shared.js";
export type { ProgressBarProps } from "./range-shared.js";
export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  children,
  ref,
  ...props
}: ProgressBarProps & RefProp<HTMLDivElement>) {
  let percentage: number | undefined;
  if (value !== undefined) {
    percentage = Math.max(0, Math.min(100, ((value - minValue) / (maxValue - minValue)) * 100));
  }
  const state = { value, percentage };

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-valuenow={value}
      data-indeterminate={dataAttr(value === undefined)}
      style={
        {
          "--comp0-progress": percentage === undefined ? undefined : `${percentage}%`,
        } as CSSProperties
      }
    >
      {typeof children === "function" ? children(state) : children}
    </div>
  );
}
