import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { type ButtonProps } from "./Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationPreviousProps<TElement extends ElementType = "button"> =
  ButtonProps<TElement>;

export function PaginationPrevious<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationPreviousProps<TElement>) {
  const pagination = usePaginationContext("PaginationPrevious");
  const resolvedDisabled = Boolean(disabled || pagination.page === 1);

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-label={props["aria-label"] ?? "Previous page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setPage(pagination.page - 1);
      }}
    />
  );
}
