import { type ComponentPropsWithRef, type ElementType } from "react";
import { dataAttr } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";

type BreadcrumbLinkOwnProps = {
  /** Marks the page you are on with aria-current="page". */
  current?: boolean | undefined;
};

/** Generic over `as` so router links keep their own props, such as `to`. */
export type BreadcrumbLinkProps<TElement extends ElementType = "a"> = BreadcrumbLinkOwnProps &
  Omit<ComponentPropsWithRef<TElement>, keyof BreadcrumbLinkOwnProps | "as"> & {
    as?: TElement | undefined;
  };

export function BreadcrumbLink<TElement extends ElementType = "a">({
  as,
  current,
  ...props
}: BreadcrumbLinkProps<TElement>) {
  const resolvedCurrent = Boolean(current);

  const Part = partElement(as, "a");
  return (
    <Part
      {...props}
      aria-current={resolvedCurrent ? "page" : undefined}
      data-current={dataAttr(resolvedCurrent)}
    />
  );
}
