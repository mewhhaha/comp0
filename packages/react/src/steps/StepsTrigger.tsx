import { Fragment, type ComponentProps, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useStepsContext, useStepsItemContext } from "./steps-shared.js";

export type StepsTriggerProps = ComponentProps<"button"> & AsProp;

/** Optional button inside a StepsItem that jumps to that step when pressed. */
export function StepsTrigger({ as, onClick, ...props }: StepsTriggerProps) {
  const steps = useStepsContext("StepsTrigger");
  const item = useStepsItemContext("StepsTrigger");
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      // Focus must reach non-native triggers or the step can never be activated
      // from the keyboard. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      aria-current={props["aria-current"] ?? (item.current ? "step" : undefined)}
      data-current={dataAttr(item.current)}
      data-completed={dataAttr(item.completed)}
      data-slot={dataSlot(props, "steps-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !props.disabled) steps.setCurrentValue(item.value);
      }}
    />
  );
}
