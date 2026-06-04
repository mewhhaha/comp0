import { type RefProp } from "../shared.js";
import { useFieldContext } from "./field-shared.js";
import { type FieldErrorProps } from "./field-shared.js";
export type { FieldErrorProps } from "./field-shared.js";
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
