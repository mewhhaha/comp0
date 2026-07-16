import { createElement, Fragment, useContext } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { StepsItemContext, useStepsContext } from "./steps-shared.js";
import { type StepsTriggerProps } from "./steps-shared.js";
export type { StepsTriggerProps } from "./steps-shared.js";

/** Optional button inside a StepsItem that jumps to that step when pressed. */
export function StepsTrigger({
  as,
  onClick,
  ref,
  ...props
}: StepsTriggerProps & RefProp<HTMLButtonElement>) {
  const steps = useStepsContext("StepsTrigger");
  const item = useContext(StepsItemContext);
  if (!item) throw new Error("StepsTrigger must be rendered inside StepsItem.");
  const triggerRef = useComposedRefs(ref);
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    // Focus must reach non-native triggers or the step can never be activated
    // from the keyboard. Fragment triggers keep their own element's focusability.
    tabIndex: isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0),
    "aria-current": props["aria-current"] ?? (item.current ? "step" : undefined),
    "data-current": dataAttr(item.current),
    "data-completed": dataAttr(item.completed),
    "data-slot": dataSlot(props, "steps-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented && !props.disabled) steps.setCurrentValue(item.value);
    },
  });
}
