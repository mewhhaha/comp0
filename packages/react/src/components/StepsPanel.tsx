import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { stepsPairIds, useStepsContext } from "./steps-shared.js";
import { type StepsPanelProps } from "./steps-shared.js";
export type { StepsPanelProps } from "./steps-shared.js";

/** Content for one step; hidden unless its value is the current step. */
export function StepsPanel({
  value,
  role = "region",
  ref,
  ...props
}: StepsPanelProps & RefProp<HTMLDivElement>) {
  const steps = useStepsContext("StepsPanel");
  const current = steps.currentValue === value;
  const { itemId, panelId } = stepsPairIds(steps.baseId, value);

  return (
    <div
      {...props}
      ref={ref}
      id={panelId}
      role={role}
      aria-labelledby={props["aria-labelledby"] ?? itemId}
      hidden={!current}
      data-slot={dataSlot(props, "steps-panel")}
      data-current={dataAttr(current)}
    />
  );
}
