import { useLayoutEffect, useState } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, resolveChildren, resolveClassName, type RefProp } from "../shared.js";
import { StepsItemContext, stepsPairIds, useStepsContext } from "./steps-shared.js";
import { type StepsItemProps, type StepsItemState } from "./steps-shared.js";
export type { StepsItemProps, StepsItemState } from "./steps-shared.js";

/**
 * One step in the list. Items register in document order, so each knows its
 * 1-based data-step position and every item before the current one carries
 * data-completed. Children may be a function of { step, current, completed }.
 */
export function StepsItem({
  value,
  children,
  className,
  ref,
  ...props
}: StepsItemProps & RefProp<HTMLLIElement>) {
  const steps = useStepsContext("StepsItem");
  const [element, setElement] = useState<HTMLLIElement | null>(null);
  const { registerItem } = steps;
  const { itemId } = stepsPairIds(steps.baseId, value);

  useLayoutEffect(() => {
    if (!element) return;
    return registerItem({ key: value, id: itemId, value, textValue: value, element });
  }, [element, itemId, registerItem, value]);

  const position = steps.order.indexOf(value);
  const currentPosition = steps.order.indexOf(steps.currentValue);
  const current = steps.currentValue === value;
  const completed = position >= 0 && currentPosition >= 0 && position < currentPosition;
  const state: StepsItemState = { step: position + 1, current, completed };

  return (
    <StepsItemContext value={{ value, current, completed }}>
      <li
        {...props}
        ref={composeRefs(ref, setElement)}
        id={itemId}
        className={resolveClassName(className, state)}
        data-slot={dataSlot(props, "steps-item")}
        data-current={dataAttr(current)}
        data-completed={dataAttr(completed)}
        data-step={position >= 0 ? position + 1 : undefined}
      >
        {resolveChildren(children, state)}
      </li>
    </StepsItemContext>
  );
}
