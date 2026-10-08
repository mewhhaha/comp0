import { type ComponentProps, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
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
  boundaryCount: boundaryCountProp = 1,
  children,
  defaultValue = 1,
  onChange,
  value,
  siblingCount: siblingCountProp = 1,
  totalPages: totalPagesProp,
  ...props
}: PaginationProps) {
  const totalPages = validCount("totalPages", totalPagesProp, 1, 1);
  const siblingCount = validCount("siblingCount", siblingCountProp, 0, 1);
  const boundaryCount = validCount("boundaryCount", boundaryCountProp, 0, 1);

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

  let content: ReactNode;
  if (typeof children === "function") content = children({ value: page, pages, totalPages });
  else content = children;

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

function validCount(name: string, count: number, minimum: number, fallback: number) {
  if (Number.isInteger(count) && count >= minimum) return count;
  const kind = minimum > 0 ? "a positive" : "a non-negative";
  warnOnce(
    `Pagination:${name}:${count}`,
    `Pagination ${name} must be ${kind} integer; received ${count}. Using ${fallback}.`,
  );
  return fallback;
}
