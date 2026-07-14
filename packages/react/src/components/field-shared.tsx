import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
export interface FieldContextValue {
  controlId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  value?: string | undefined;
  setValue?: ((value: string) => void) | undefined;
  valueControlled?: boolean | undefined;
  resetValue?: (() => void) | undefined;
  restoreValue?: ((value: string) => void) | undefined;
  descriptionMounted?: boolean | undefined;
  errorMounted?: boolean | undefined;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext() {
  return useContext(FieldContext);
}

export function useFieldIds(id: string | undefined) {
  const reactId = useId();
  const controlId = id ?? `comp0-${reactId}`;

  return {
    controlId,
    labelId: `${controlId}-label`,
    descriptionId: `${controlId}-description`,
    errorId: `${controlId}-error`,
  };
}

export const fieldFeedbackPart = Symbol("comp0.field-feedback-part");

type FieldFeedbackComponent = {
  [fieldFeedbackPart]?: "description" | "error";
};

/** Reads declaratively rendered feedback so ARIA relationships exist in server markup. */
export function fieldFeedback(children: ReactNode, invalid = false) {
  let descriptionMounted = false;
  let errorMounted = false;

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<{ children?: ReactNode; forceMount?: boolean }>(child)) return;
      const part = (child.type as FieldFeedbackComponent)[fieldFeedbackPart];
      if (part === "description") descriptionMounted = true;
      if (part === "error" && (invalid || Boolean(child.props.forceMount))) {
        errorMounted = true;
      }
      if (!descriptionMounted || !errorMounted) visit(child.props.children);
    });
  };
  visit(children);
  return { descriptionMounted, errorMounted };
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
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export type DescriptionProps = HTMLAttributes<HTMLDivElement>;

export type FieldErrorProps = HTMLAttributes<HTMLDivElement> & {
  forceMount?: boolean | undefined;
};

export type FieldsetProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export type LegendProps = HTMLAttributes<HTMLLegendElement>;
