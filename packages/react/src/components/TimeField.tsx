import { type RefProp } from "../shared.js";
import { DateFieldRoot } from "./date-time-shared.js";
import { type DateFieldProps } from "./date-time-shared.js";
export function TimeField(props: DateFieldProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return DateFieldRoot("time", props, ref);
}
