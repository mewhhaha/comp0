import { type RefProp } from "../shared.js";
import { type ListBoxSectionProps } from "./collection-shared.js";
export type { ListBoxSectionProps } from "./collection-shared.js";
export function ListBoxSection(props: ListBoxSectionProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}
