import { type RefProp } from "../shared.js";
import { useFieldContext } from "./field-shared.js";
import { type DescriptionProps } from "./field-shared.js";
export type { DescriptionProps } from "./field-shared.js";
export function Description({ id, ref, ...props }: DescriptionProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  return <div {...props} ref={ref} id={id ?? field?.descriptionId} />;
}
