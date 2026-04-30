import { type RefProp } from "../shared.js";
import { DateFieldRoot } from "./date-time-shared.js";
import { type DateFieldProps } from "./date-time-shared.js";
export type { DateFieldProps } from "./date-time-shared.js";
export function DateField(props: DateFieldProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return DateFieldRoot("date", props, ref);
}
