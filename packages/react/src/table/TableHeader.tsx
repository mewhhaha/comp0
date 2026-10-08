import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TableHeaderProps = ComponentProps<"thead"> & AsProp;

export function TableHeader({ as, ...props }: TableHeaderProps) {
  const Part = partElement(as, "thead");
  return <Part {...props} />;
}
