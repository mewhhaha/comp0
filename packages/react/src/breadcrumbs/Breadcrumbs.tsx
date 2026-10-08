import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type BreadcrumbsProps = ComponentProps<"nav"> & AsProp;

export function Breadcrumbs({
  as,
  "aria-label": ariaLabel = "Breadcrumbs",
  ...props
}: BreadcrumbsProps) {
  const Part = partElement(as, "nav");
  return <Part {...props} aria-label={ariaLabel} />;
}
