import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { PaginationControl, type PaginationControlProps } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationLastProps<TElement extends ElementType = "button"> =
  PaginationControlProps<TElement>;

export function PaginationLast<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationLastProps<TElement>) {
  const pagination = usePaginationContext("PaginationLast");
  const resolvedDisabled = Boolean(disabled || pagination.value === pagination.totalPages);

  return (
    <PaginationControl
      {...(props as PaginationControlProps<ElementType>)}
      aria-label={props["aria-label"] ?? "Last page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setValue(pagination.totalPages);
      }}
    />
  );
}
