import {
  createContext,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
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

export function describedBy(
  context: FieldContextValue | null,
  describedByProp?: string | undefined,
) {
  return [describedByProp, context?.descriptionId, context?.invalid ? context.errorId : undefined]
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
