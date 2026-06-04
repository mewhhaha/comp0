import { type RefProp } from "../shared.js";
import { dataAttr } from "@comp0/core";
import { type BreadcrumbLinkProps } from "./disclosure-shared.js";
export type { BreadcrumbLinkProps } from "./disclosure-shared.js";
export function BreadcrumbLink({
  current,
  children,
  ref,
  ...props
}: BreadcrumbLinkProps & RefProp<HTMLAnchorElement>) {
  const resolvedCurrent = Boolean(current);
  return (
    <a
      {...props}
      ref={ref}
      aria-current={resolvedCurrent ? "page" : undefined}
      data-current={dataAttr(resolvedCurrent)}
    >
      {children}
    </a>
  );
}
