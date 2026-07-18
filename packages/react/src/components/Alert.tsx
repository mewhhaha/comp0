import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

/** An assertive live message for important, time-sensitive feedback. */
export function Alert({ ref, ...props }: AlertProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role="alert" data-slot={dataSlot(props, "alert")} />;
}
