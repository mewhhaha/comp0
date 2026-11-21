import { Fragment, useRef, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { disabledProps } from "../internal/disabled.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useStepsContext, useStepsItemContext } from "./steps-shared.js";

const ignoreFocus = () => {};

export type StepsTriggerProps = ComponentProps<"button"> & AsProp;

/** Optional button inside a StepsItem that jumps to that step when pressed. */
export function StepsTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  ref,
  ...props
}: StepsTriggerProps) {
  const steps = useStepsContext("StepsTrigger");
  const item = useStepsItemContext("StepsTrigger");
  const isNativeButton = as === undefined || as === "button";
  const elementRef = useRef<HTMLButtonElement | null>(null);
  // Completion depends on the whole list, which the server can see in another order.
  useHydrationRepair(elementRef, { "data-completed": item.completed ? "" : null }, ignoreFocus);

  const disabledAttributes = disabledProps<HTMLButtonElement>(disabled, {
    native: isNativeButton,
    onClick(event) {
      onClick?.(event);
      if (!event.defaultPrevented) steps.select(item.value);
    },
    onKeyDown,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-comp0="steps-trigger"
      {...props}
      // The trigger registers nothing, so a ref the compiler memoizes on `ref` is enough; an inline
      // consumer ref re-attaches each render, as it would on the element itself.
      ref={composeRefs(ref, elementRef)}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      // Focus must reach non-native triggers or the step can never be activated
      // from the keyboard. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      aria-current={props["aria-current"] ?? (item.current ? "step" : undefined)}
      data-current={dataAttr(item.current)}
      data-completed={dataAttr(item.completed)}
      {...disabledAttributes}
    />
  );
}
