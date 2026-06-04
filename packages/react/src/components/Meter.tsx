import { type RefProp } from "../shared.js";
import { dataAttr } from "@comp0/core";
import { type MeterProps } from "./range-shared.js";
export type { MeterProps } from "./range-shared.js";
export function Meter({
  value,
  min = 0,
  max = 1,
  ref,
  ...props
}: MeterProps & RefProp<HTMLMeterElement>) {
  return (
    <meter
      {...props}
      ref={ref}
      value={value}
      min={min}
      max={max}
      data-complete={dataAttr(value >= Number(max))}
    />
  );
}
