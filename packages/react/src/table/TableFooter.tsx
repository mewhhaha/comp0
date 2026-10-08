import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TableFooterProps = ComponentProps<"tfoot"> & AsProp;

export function TableFooter({ as, ...props }: TableFooterProps) {
  const Part = partElement(as, "tfoot");
  return <Part {...props} />;
}
