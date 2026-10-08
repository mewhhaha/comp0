import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { PaginationControl, type PaginationControlProps } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationFirstProps<TElement extends ElementType = "button"> =
  PaginationControlProps<TElement>;

export function PaginationFirst<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationFirstProps<TElement>) {
  const pagination = usePaginationContext("PaginationFirst");
  const resolvedDisabled = Boolean(disabled || pagination.value === 1);

  return (
    <PaginationControl
      {...(props as PaginationControlProps<ElementType>)}
      aria-label={props["aria-label"] ?? "First page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setValue(1);
      }}
    />
  );
}
