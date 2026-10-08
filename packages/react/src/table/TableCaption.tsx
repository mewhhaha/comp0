import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type TableCaptionProps = ComponentProps<"caption"> & AsProp;

export function TableCaption({ as, ...props }: TableCaptionProps) {
  const Part = partElement(as, "caption");
  return <Part {...props} />;
}
