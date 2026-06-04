import { useId } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type TooltipProps } from "./overlay-shared.js";
export type { TooltipProps } from "./overlay-shared.js";
export function Tooltip({
  id,
  role = "tooltip",
  open = true,
  hidden,
  ref,
  ...props
}: TooltipProps & RefProp<HTMLDivElement>) {
  const generatedId = useId();
  return (
    <div
      {...props}
      ref={ref}
      id={id ?? generatedId}
      role={role}
      hidden={hidden ?? !open}
      data-open={dataAttr(open)}
    />
  );
}
