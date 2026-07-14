import { type RefProp } from "../shared.js";
import { fieldFeedbackPart, useFieldContext } from "./field-shared.js";
import { type FieldErrorProps } from "./field-shared.js";
export type { FieldErrorProps } from "./field-shared.js";
export function FieldError({
  id,
  forceMount,
  ref,
  ...props
}: FieldErrorProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  const mounted = Boolean(forceMount || field?.invalid);
  if (!mounted) return null;
  return <div {...props} ref={ref} id={id ?? field?.errorId} role="alert" />;
}

Object.assign(FieldError, { [fieldFeedbackPart]: "error" as const });
