import { dataSlot, type RefProp } from "../shared.js";
import { type StepsListProps } from "./steps-shared.js";
export type { StepsListProps } from "./steps-shared.js";

/** Ordered list of steps; the sequence itself is meaningful. */
export function StepsList({ ref, ...props }: StepsListProps & RefProp<HTMLOListElement>) {
  return <ol {...props} ref={ref} data-slot={dataSlot(props, "steps-list")} />;
}
