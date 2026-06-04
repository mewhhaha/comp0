import { type RefProp } from "../shared.js";
import { type DialogProps } from "./overlay-shared.js";
export type { DialogProps } from "./overlay-shared.js";
export function Dialog({
  role = "dialog",
  tabIndex = -1,
  ref,
  ...props
}: DialogProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role={role} tabIndex={tabIndex} />;
}
