import { type RefProp } from "../shared.js";
import { type MenuSectionProps } from "./menu-shared.js";

export type { MenuSectionProps } from "./menu-shared.js";

export function MenuSection({ ref, ...props }: MenuSectionProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role={props.role ?? "group"} />;
}
