import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Output represents a calculation result; Status is generic advisory feedback. */

export type StatusProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

/** A polite live message for advisory feedback that does not interrupt. */
export function Status({ ref, ...props }: StatusProps & RefProp<HTMLDivElement>) {
  return <div {...props} ref={ref} role="status" data-slot={dataSlot(props, "status")} />;
}
