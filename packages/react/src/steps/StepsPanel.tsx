import { useSyncExternalStore, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
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
  const { status, value: controlledValue } = steps;
  const isCurrent = () => (controlledValue ?? status.current()) === value;
  // A primitive per panel, so an uncontrolled move re-renders only the two panels it flips.
  const current = useSyncExternalStore(status.subscribe, isCurrent, isCurrent);
  // Panels hold no items, so the collection pass skips them and whatever they contain.
  const collecting = useIsCollectionPass();
  if (collecting) return null;
  const { itemId, panelId } = stepsPairIds(steps.baseId, value);

  const Part = partElement(as, "div");
  return (
    <Part
      data-comp0="steps-panel"
      {...props}
      id={panelId}
      role={role}
      aria-labelledby={props["aria-labelledby"] ?? itemId}
      hidden={!current}
      data-current={dataAttr(current)}
    />
  );
}
