import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import { DialogContext, popoverAnchorName } from "./overlay-shared.js";
import { TourContext, type TourState, type TourStep } from "./tour-shared.js";
export type { TourState, TourStep } from "./tour-shared.js";

export type TourProps = {
  steps: readonly TourStep[];
  step?: number | null | undefined;
  defaultStep?: number | null | undefined;
  onStepChange?: ((step: number | null) => void) | undefined;
  children?: ReactNode | undefined;
};

export function Tour({
  steps,
  step: stepProp,
  defaultStep = null,
  onStepChange,
  children,
}: TourProps) {
  if (steps.length === 0) throw new Error("Tour requires at least one step; received 0.");
  const seenTargets = new Set<string>();
  for (const tourStep of steps) {
    if (!tourStep.target) throw new Error("Tour step targets must not be empty.");
    if (seenTargets.has(tourStep.target)) {
      throw new Error(`Tour target "${tourStep.target}" is used by more than one step.`);
    }
    seenTargets.add(tourStep.target);
  }

  const generatedId = useId();
  const triggerElement = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const wasActive = useRef(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [stepIndex, setStepIndex] = useControllableState<number | null>({
    value: stepProp,
    defaultValue: defaultStep,
    onChange: onStepChange,
  });
  if (
    stepIndex !== null &&
    (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= steps.length)
  ) {
    throw new Error(
      `Tour step must be null or an index from 0 to ${steps.length - 1}; received ${stepIndex}.`,
    );
  }
  const currentStep = stepIndex === null ? null : steps[stepIndex]!;
  const targetName = currentStep?.target;
  const triggerId = `${generatedId}-trigger`;
  const contentId = `${generatedId}-content`;
  const anchorName = popoverAnchorName(triggerId)!;

  useLayoutEffect(() => {
    if (!targetName) {
      setTargetElement(null);
      return;
    }
    const ownerDocument = triggerElement.current?.ownerDocument ?? document;
    const matches = Array.from(
      ownerDocument.querySelectorAll<HTMLElement>("[data-tour-target]"),
    ).filter((element) => element.getAttribute("data-tour-target") === targetName);
    if (matches.length !== 1) {
      throw new Error(
        `Tour target "${targetName}" must match exactly one element; found ${matches.length}.`,
      );
    }

    const target = matches[0]!;
    const previousAnchorName = target.style.getPropertyValue("anchor-name");
    const previousAnchorPriority = target.style.getPropertyPriority("anchor-name");
    const hadActiveAttribute = target.hasAttribute("data-tour-active");
    const previousActiveAttribute = target.getAttribute("data-tour-active");
    target.style.setProperty("anchor-name", anchorName);
    target.setAttribute("data-tour-active", "");
    target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    setTargetElement(target);

    return () => {
      if (target.style.getPropertyValue("anchor-name") === anchorName) {
        if (previousAnchorName) {
          target.style.setProperty("anchor-name", previousAnchorName, previousAnchorPriority);
        } else {
          target.style.removeProperty("anchor-name");
        }
      }
      if (hadActiveAttribute) {
        target.setAttribute("data-tour-active", previousActiveAttribute ?? "");
      } else {
        target.removeAttribute("data-tour-active");
      }
    };
  }, [anchorName, targetName]);

  useLayoutEffect(() => {
    const active = stepIndex !== null;
    if (wasActive.current && !active && restoreFocus.current) triggerElement.current?.focus();
    if (!active) restoreFocus.current = false;
    wasActive.current = active;
  }, [stepIndex]);

  const close = () => {
    restoreFocus.current = true;
    setStepIndex(null);
  };
  const previous = () => {
    if (stepIndex === null || stepIndex === 0) return;
    setStepIndex(stepIndex - 1);
  };
  const next = () => {
    if (stepIndex === null) return;
    if (stepIndex === steps.length - 1) {
      close();
      return;
    }
    setStepIndex(stepIndex + 1);
  };
  const start = () => {
    restoreFocus.current = false;
    setStepIndex(0);
  };
  const open = currentStep !== null && targetElement !== null;
  let state: TourState | null = null;
  if (currentStep && stepIndex !== null) {
    state = {
      step: currentStep,
      stepIndex,
      stepCount: steps.length,
      first: stepIndex === 0,
      last: stepIndex === steps.length - 1,
      previous,
      next,
      close,
    };
  }

  return (
    <DialogContext
      value={{
        contentId,
        open,
        triggerId,
        setOpen(nextOpen) {
          if (nextOpen) start();
          else close();
        },
        focusTrigger() {
          triggerElement.current?.focus();
        },
        setTriggerElement(element) {
          triggerElement.current = element;
        },
      }}
    >
      <TourContext
        value={{
          contentId,
          focusTrigger() {
            triggerElement.current?.focus();
          },
          open,
          state,
          start,
          triggerId,
          setTriggerElement(element) {
            triggerElement.current = element;
          },
        }}
      >
        {children}
      </TourContext>
    </DialogContext>
  );
}
