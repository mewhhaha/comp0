import { type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import {
  resolveChildren,
  resolveClassName,
  type RefProp,
  type SharedStateProps,
} from "../shared.js";
import { PaginationContext } from "./pagination-shared.js";

export type PaginationRangeEntry = number | "start-ellipsis" | "end-ellipsis";

export type PaginationState = {
  page: number;
  pages: PaginationRangeEntry[];
  totalPages: number;
};

export type PaginationProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "className" | "onChange"
> &
  SharedStateProps<PaginationState> & {
    page?: number | undefined;
    defaultPage?: number | undefined;
    totalPages: number;
    siblingCount?: number | undefined;
    boundaryCount?: number | undefined;
    onChange?: ((page: number) => void) | undefined;
  };

export function Pagination({
  "aria-label": ariaLabel = "Pagination",
  boundaryCount = 1,
  children,
  className,
  defaultPage = 1,
  onChange,
  page: pageProp,
  siblingCount = 1,
  totalPages,
  ref,
  ...props
}: PaginationProps & RefProp<HTMLElement>) {
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
    value: pageProp,
    defaultValue: defaultPage,
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

  const state = { page, pages, totalPages };

  return (
    <PaginationContext
      value={{
        page,
        totalPages,
        setPage(nextPage) {
          setUnclampedPage(Math.min(totalPages, Math.max(1, nextPage)));
        },
      }}
    >
      <nav
        {...props}
        ref={ref}
        aria-label={ariaLabel}
        data-page={page}
        data-first={dataAttr(page === 1)}
        data-last={dataAttr(page === totalPages)}
        className={resolveClassName(className, state)}
      >
        {resolveChildren(children, state)}
      </nav>
    </PaginationContext>
  );
}
