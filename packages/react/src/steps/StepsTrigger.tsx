import { Fragment, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useStepsContext, useStepsItemContext } from "./steps-shared.js";

export type StepsTriggerProps = ComponentProps<"button"> & AsProp;

/** Optional button inside a StepsItem that jumps to that step when pressed. */
export function StepsTrigger({ as, disabled, onClick, onKeyDown, ...props }: StepsTriggerProps) {
  const steps = useStepsContext("StepsTrigger");
  const item = useStepsItemContext("StepsTrigger");
  const isNativeButton = as === undefined || as === "button";

  const disabledAttributes = disabledProps<HTMLButtonElement>(disabled, {
    native: isNativeButton,
    onClick(event) {
      onClick?.(event);
      if (!event.defaultPrevented) steps.setCurrentValue(item.value);
    },
    onKeyDown,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="steps-trigger"
      {...props}
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
