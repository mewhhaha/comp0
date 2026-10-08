import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { PaginationControl, type PaginationControlProps } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationNextProps<TElement extends ElementType = "button"> =
  PaginationControlProps<TElement>;

export function PaginationNext<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationNextProps<TElement>) {
  const pagination = usePaginationContext("PaginationNext");
  const resolvedDisabled = Boolean(disabled || pagination.value === pagination.totalPages);

  return (
    <PaginationControl
      {...(props as PaginationControlProps<ElementType>)}
      aria-label={props["aria-label"] ?? "Next page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setValue(pagination.value + 1);
      }}
    />
  );
}
