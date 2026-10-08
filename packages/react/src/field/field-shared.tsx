import { type ControllableStateControls } from "@comp0/core";
import { Children, isValidElement, useId, type ReactNode } from "react";
import { createRequiredContext } from "../internal/context.js";

export type FieldContextValue = {
  controlId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  characterCountId?: string | undefined;
  textControl?: true | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  value?: string | undefined;
  setValue?: ((value: string) => void) | undefined;
  valueState?: ControllableStateControls<string> | undefined;
  descriptionMounted?: boolean | undefined;
  errorMounted?: boolean | undefined;
  characterCountMounted?: boolean | undefined;
};

// Controls work with or without a surrounding field, so parts read the optional context.
export const [FieldContext, , useFieldContext] = createRequiredContext<FieldContextValue>("Field");

export function useFieldIds(id: string | undefined) {
  const reactId = useId();
  const controlId = id ?? `comp0-${reactId}`;

  return {
    controlId,
    labelId: `${controlId}-label`,
    descriptionId: `${controlId}-description`,
    errorId: `${controlId}-error`,
    characterCountId: `${controlId}-character-count`,
  };
}

export const fieldFeedbackPart = Symbol("comp0.field-feedback-part");

type FieldFeedbackComponent = {
  [fieldFeedbackPart]?: "description" | "error" | "character-count";
};

/** Reads declaratively rendered feedback so ARIA relationships exist in server markup. */
export function fieldFeedback(children: ReactNode, invalid = false) {
  let descriptionMounted = false;
  let errorMounted = false;
  let characterCountMounted = false;

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<{ children?: ReactNode; forceMount?: boolean }>(child)) return;
      const part = (child.type as FieldFeedbackComponent)[fieldFeedbackPart];
      if (part === "description") descriptionMounted = true;
      if (part === "error" && (invalid || Boolean(child.props.forceMount))) {
        errorMounted = true;
      }
      if (part === "character-count") characterCountMounted = true;
      if (!descriptionMounted || !errorMounted || !characterCountMounted) {
        visit(child.props.children);
      }
    });
  };
  visit(children);
  return { characterCountMounted, descriptionMounted, errorMounted };
}

export function describedBy(
  context: FieldContextValue | null,
  describedByProp?: string | undefined,
) {
  const hasDescription = context?.descriptionMounted ?? false;
  const hasError = context?.errorMounted ?? false;
  return [
    describedByProp,
    hasDescription ? context?.descriptionId : undefined,
    context?.invalid && hasError ? context.errorId : undefined,
    context?.characterCountMounted ? context.characterCountId : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}
