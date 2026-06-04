import { type RefProp } from "../shared.js";
import { useFieldContext } from "./field-shared.js";
import { type LabelProps } from "./field-shared.js";
export type { LabelProps } from "./field-shared.js";
export function Label({ id, htmlFor, ref, ...props }: LabelProps & RefProp<HTMLLabelElement>) {
  const field = useFieldContext();
  return (
    <label {...props} ref={ref} id={id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} />
  );
}
