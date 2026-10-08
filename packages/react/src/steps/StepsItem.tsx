import { useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { StepsItemContext, stepsPairIds, useStepsContext } from "./steps-shared.js";

export type StepsItemProps = Omit<ComponentProps<"li">, "id" | "value"> &
  AsProp & {
    /** Identity that pairs this item with its panel through the root's value. */
    value: string;
  };

/**
 * One step in the list. Items register in document order, so each knows its
 * 1-based data-step position and every item before the current one carries
 * data-completed. Style the states with data-current, data-completed and data-step.
 */
export function StepsItem({ as, value, ref, ...props }: StepsItemProps) {
  const steps = useStepsContext("StepsItem");
  const [element, setElement] = useState<HTMLLIElement | null>(null);
  const { collection } = steps;
  const { itemId } = stepsPairIds(steps.baseId, value);

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({ key: value, id: itemId, textValue: value, element });
    return () => {
      collection.unregister(value, element);
    };
  }, [collection, element, itemId, value]);

  const position = steps.order.indexOf(value);
  const currentPosition = steps.order.indexOf(steps.currentValue);
  const current = steps.currentValue === value;
  const completed = position >= 0 && currentPosition >= 0 && position < currentPosition;
  let step: number | undefined;
  if (position >= 0) step = position + 1;

  const Part = partElement(as, "li");
  return (
    <StepsItemContext value={{ value, current, completed }}>
      <Part
        {...props}
        ref={composeRefs(ref, setElement)}
        id={itemId}
        data-slot={dataSlot(props, "steps-item")}
        data-current={dataAttr(current)}
        data-completed={dataAttr(completed)}
        data-step={step}
      />
    </StepsItemContext>
  );
}
