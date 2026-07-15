import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The native section also needs an explicit rowgroup role inside treegrid. */

export type TreeGridRowGroupProps = HTMLAttributes<HTMLTableSectionElement> & {
  /** Uses the native section matching the rows this group contains. */
  as?: "thead" | "tbody" | undefined;
};

export function TreeGridRowGroup({
  as: Group = "tbody",
  ref,
  ...props
}: TreeGridRowGroupProps & RefProp<HTMLTableSectionElement>) {
  return <Group {...props} ref={ref} role="rowgroup" />;
}
