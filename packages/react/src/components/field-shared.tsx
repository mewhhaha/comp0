import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
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
  descriptionMounted?: boolean | undefined;
  errorMounted?: boolean | undefined;
  registerDescription?: (() => () => void) | undefined;
  registerError?: (() => () => void) | undefined;
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

/**
 * Tracks whether a Description or FieldError is actually rendered so
 * aria-describedby never references an id that does not exist. Providers
 * feed the flags and register callbacks into their FieldContext value.
 */
export function useFieldFeedback() {
  const [descriptionMounted, setDescriptionMounted] = useState(false);
  const [errorMounted, setErrorMounted] = useState(false);
  // These identities feed effect dependencies in Description and FieldError;
  // useCallback keeps them stable even where the React Compiler bails out.
  const registerDescription = useCallback(() => {
    setDescriptionMounted(true);
    return () => setDescriptionMounted(false);
  }, []);
  const registerError = useCallback(() => {
    setErrorMounted(true);
    return () => setErrorMounted(false);
  }, []);
  return { descriptionMounted, errorMounted, registerDescription, registerError };
}

export function describedBy(
  context: FieldContextValue | null,
  describedByProp?: string | undefined,
) {
  // Contexts hand-rolled without mount tracking keep referencing both ids.
  const hasDescription = context?.descriptionMounted ?? true;
  const hasError = context?.errorMounted ?? true;
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
