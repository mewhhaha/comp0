import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { stepsPairIds, useStepsContext } from "./steps-shared.js";

export type StepsPanelProps = Omit<ComponentProps<"div">, "id" | "role"> &
  AsProp & {
    /** Identity that pairs this panel with its item through the root's value. */
    value: string;
    role?: "region" | "group" | undefined;
  };

/** Content for one step; hidden unless its value is the current step. */
export function StepsPanel({ as, value, role = "region", ...props }: StepsPanelProps) {
  const steps = useStepsContext("StepsPanel");
  const current = steps.currentValue === value;
  const { itemId, panelId } = stepsPairIds(steps.baseId, value);

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      id={panelId}
      role={role}
      aria-labelledby={props["aria-labelledby"] ?? itemId}
      hidden={!current}
      data-slot={dataSlot(props, "steps-panel")}
      data-current={dataAttr(current)}
    />
  );
}
