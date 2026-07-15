import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { type ButtonProps } from "./Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationNextProps<TElement extends ElementType = "button"> = ButtonProps<TElement>;

export function PaginationNext<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationNextProps<TElement>) {
  const pagination = usePaginationContext("PaginationNext");
  const resolvedDisabled = Boolean(disabled || pagination.page === pagination.totalPages);

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-label={props["aria-label"] ?? "Next page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setPage(pagination.page + 1);
      }}
    />
  );
}
