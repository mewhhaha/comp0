import { useLayoutEffect, useRef, useSyncExternalStore, type ComponentProps } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { useCollectedItem, useIsCollectionPass } from "../internal/collection-pass.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { StepsItemContext, stepsPairIds, useStepsContext } from "./steps-shared.js";

const ignoreFocus = () => {};

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
  // Inside Steps' collection pass the item only records its value, so the real items know every
  // step's place before they render. One component rather than a thin wrapper around a part: the
  // wrapper's extra component per item cost about 30 ms of a controlled 1000-item step change
  // (PERFORMANCE.md "Steps"). The hooks below do nothing in the pass, which renders no element:
  // no ref attaches, so nothing registers or is repaired.
  const collecting = useIsCollectionPass();
  useCollectedItem(steps.seed, value, false);
  // The ref callback reads only the stable collection, so it never depends on the current step.
  const { items, seed, status, value: controlledValue } = steps;
  const { collection } = items;
  const { itemId } = stepsPairIds(steps.baseId, value);
  const position = useSyncExternalStore(
    items.subscribe,
    () => items.position(value),
    () => seed.position(value),
  );
  // A primitive per item, so an uncontrolled move re-renders only the items it flips.
  const itemStatus = useSyncExternalStore(
    status.subscribe,
    () => status.status(value, controlledValue),
    () => status.serverStatus(value, controlledValue),
  );

  const current = itemStatus === "current";
  const completed = itemStatus === "completed";
  let step: number | undefined;
  if (position !== undefined) step = position + 1;

  const elementRef = useRef<HTMLLIElement | null>(null);
  // The position depends on the whole list, which the server can see in another order.
  useHydrationRepair(
    elementRef,
    {
      "data-step": step === undefined ? null : `${step}`,
      "data-completed": completed ? "" : null,
    },
    ignoreFocus,
  );
  const itemRef = useComposedRefs(ref, elementRef, (element: HTMLLIElement | null) => {
    if (!element) return;
    collection.register({ key: value, id: itemId, textValue: value, element });
    // Guarded by element, so a stale cleanup never removes what a newer element registered
    // under this value.
    return () => {
      collection.unregister(value, element);
    };
  });
  // A keyed reorder moves elements without registering anything; see `verify` for its limit.
  useLayoutEffect(() => {
    if (!collecting) items.verify(value);
  });

  if (collecting) return null;
  const Part = partElement(as, "li");
  return (
    <StepsItemContext value={{ value, current, completed }}>
      <Part
        data-comp0="steps-item"
        {...props}
        ref={itemRef}
        id={itemId}
        data-current={dataAttr(current)}
        data-completed={dataAttr(completed)}
        data-step={step}
      />
    </StepsItemContext>
  );
}
