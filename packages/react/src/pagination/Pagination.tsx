import { type ComponentProps, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { PaginationContext } from "./pagination-shared.js";

export type PaginationRangeEntry = number | "start-ellipsis" | "end-ellipsis";

/** The computed page range a function child maps into page controls and ellipses. */
export type PaginationData = {
  value: number;
  pages: PaginationRangeEntry[];
  totalPages: number;
};

export type PaginationProps = Omit<
  ComponentProps<"nav">,
  "children" | "defaultValue" | "onChange"
> &
  AsProp & {
    /** Controlled current page, starting at 1. */
    value?: number | undefined;
    /** Initial page when uncontrolled. */
    defaultValue?: number | undefined;
    totalPages: number;
    siblingCount?: number | undefined;
    boundaryCount?: number | undefined;
    onChange?: ((value: number) => void) | undefined;
    /** Page controls, or a function that maps the computed page range into them. */
    children?: ReactNode | ((data: PaginationData) => ReactNode);
  };

export function Pagination({
  as,
  "aria-label": ariaLabel = "Pagination",
  boundaryCount = 1,
  children,
  defaultValue = 1,
  onChange,
  value,
  siblingCount = 1,
  totalPages,
  ...props
}: PaginationProps) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new RangeError(
      `Pagination totalPages must be a positive integer; received ${totalPages}.`,
    );
  }
  if (!Number.isInteger(siblingCount) || siblingCount < 0) {
    throw new RangeError(
      `Pagination siblingCount must be a non-negative integer; received ${siblingCount}.`,
    );
  }
  if (!Number.isInteger(boundaryCount) || boundaryCount < 0) {
    throw new RangeError(
      `Pagination boundaryCount must be a non-negative integer; received ${boundaryCount}.`,
    );
  }

  const [unclampedPage, setUnclampedPage] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const page = Math.min(totalPages, Math.max(1, Math.trunc(unclampedPage)));
  const visibleSlots = boundaryCount * 2 + siblingCount * 2 + 3;
  const pages: PaginationRangeEntry[] = [];

  if (totalPages <= visibleSlots) {
    for (let current = 1; current <= totalPages; current += 1) pages.push(current);
  } else {
    const leftSibling = Math.max(page - siblingCount, boundaryCount + 2);
    const rightSibling = Math.min(page + siblingCount, totalPages - boundaryCount - 1);

    for (let current = 1; current <= boundaryCount; current += 1) pages.push(current);

    if (leftSibling > boundaryCount + 2) pages.push("start-ellipsis");
    else if (leftSibling === boundaryCount + 2) pages.push(boundaryCount + 1);

    for (let current = leftSibling; current <= rightSibling; current += 1) pages.push(current);

    if (rightSibling < totalPages - boundaryCount - 1) pages.push("end-ellipsis");
    else if (rightSibling === totalPages - boundaryCount - 1) {
      pages.push(totalPages - boundaryCount);
    }

    const lastBoundary = Math.max(totalPages - boundaryCount + 1, boundaryCount + 1);
    for (let current = lastBoundary; current <= totalPages; current += 1) pages.push(current);
  }

  let content = children;
  if (typeof children === "function") content = children({ value: page, pages, totalPages });

  const Part = partElement(as, "nav");
  return (
    <PaginationContext
      value={{
        value: page,
        totalPages,
        setValue(nextPage) {
          setUnclampedPage(Math.min(totalPages, Math.max(1, nextPage)));
        },
      }}
    >
      <Part
        {...props}
        aria-label={ariaLabel}
        data-page={page}
        data-first={dataAttr(page === 1)}
        data-last={dataAttr(page === totalPages)}
      >
        {content}
      </Part>
    </PaginationContext>
  );
}
