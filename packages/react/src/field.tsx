import { type RefProp } from "./shared.js";
import {
  createContext,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { dataAttr } from "@comp0/core";

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

const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext() {
  return useContext(FieldContext);
}

export function FieldProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FieldContextValue;
}) {
  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
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

export function Label({ id, htmlFor, ref, ...props }: LabelProps & RefProp<HTMLLabelElement>) {
  const field = useFieldContext();
  return (
    <label {...props} ref={ref} id={id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} />
  );
}

export type DescriptionProps = HTMLAttributes<HTMLDivElement>;

export function Description({ id, ref, ...props }: DescriptionProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  return <div {...props} ref={ref} id={id ?? field?.descriptionId} />;
}

export type FieldErrorProps = HTMLAttributes<HTMLDivElement> & {
  forceMount?: boolean | undefined;
};

export function FieldError({
  id,
  forceMount,
  ref,
  ...props
}: FieldErrorProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  if (!forceMount && !field?.invalid) return null;
  return <div {...props} ref={ref} id={id ?? field?.errorId} role="alert" />;
}

export type FieldsetProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function Fieldset({
  children,
  id,
  disabled,
  invalid,
  required,
  ref,
  ...props
}: FieldsetProps & RefProp<HTMLFieldSetElement>) {
  const ids = useFieldIds(id);
  const fieldDisabled = Boolean(disabled);
  const fieldInvalid = Boolean(invalid);
  const fieldRequired = Boolean(required);
  return (
    <FieldProvider
      value={{
        ...ids,
        disabled: fieldDisabled,
        invalid: fieldInvalid,
        required: fieldRequired,
      }}
    >
      <fieldset
        {...props}
        ref={ref}
        id={id}
        disabled={fieldDisabled}
        aria-describedby={describedBy({ ...ids, invalid: fieldInvalid })}
        aria-invalid={fieldInvalid || undefined}
        data-disabled={dataAttr(fieldDisabled)}
        data-invalid={dataAttr(fieldInvalid)}
        data-required={dataAttr(fieldRequired)}
      >
        {children}
      </fieldset>
    </FieldProvider>
  );
}

export type LegendProps = HTMLAttributes<HTMLLegendElement>;

export function Legend({ id, ref, ...props }: LegendProps & RefProp<HTMLLegendElement>) {
  const field = useFieldContext();
  return <legend {...props} ref={ref} id={id ?? field?.labelId} />;
}
