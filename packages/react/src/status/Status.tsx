import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Output represents a calculation result; Status is generic advisory feedback. */

export type StatusProps = Omit<ComponentProps<"div">, "role"> & AsProp;

/** A polite live message for advisory feedback that does not interrupt. */
export function Status({ as, ...props }: StatusProps) {
  const Part = partElement(as, "div");
  return <Part {...props} role="status" data-slot={dataSlot(props, "status")} />;
}
