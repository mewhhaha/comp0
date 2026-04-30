import { type RefProp } from "../shared.js";
import { type MenuSectionProps } from "./collection-shared.js";
export type { MenuSectionProps } from "./collection-shared.js";
export function MenuSection(props: MenuSectionProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}
