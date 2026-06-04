import { type RefProp } from "../shared.js";
import { type BreadcrumbsProps } from "./disclosure-shared.js";
export type { BreadcrumbsProps } from "./disclosure-shared.js";
export function Breadcrumbs({
  "aria-label": ariaLabel = "Breadcrumbs",
  ref,
  ...props
}: BreadcrumbsProps & RefProp<HTMLElement>) {
  return <nav {...props} ref={ref} aria-label={ariaLabel} />;
}
