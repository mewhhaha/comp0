import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type AlertProps = Omit<ComponentProps<"div">, "role"> & AsProp;

/** An assertive live message for important, time-sensitive feedback. */
export function Alert({ as, ...props }: AlertProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role="alert" data-slot={dataSlot(props, "alert")} />;
}
