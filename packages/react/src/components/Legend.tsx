import { type RefProp } from "../shared.js";
import { useFieldContext } from "./field-shared.js";
import { type LegendProps } from "./field-shared.js";
export type { LegendProps } from "./field-shared.js";
export function Legend({ id, ref, ...props }: LegendProps & RefProp<HTMLLegendElement>) {
  const field = useFieldContext();
  return <legend {...props} ref={ref} id={id ?? field?.labelId} />;
}
