import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { type ButtonProps } from "./Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationFirstProps<TElement extends ElementType = "button"> = ButtonProps<TElement>;

export function PaginationFirst<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationFirstProps<TElement>) {
  const pagination = usePaginationContext("PaginationFirst");
  const resolvedDisabled = Boolean(disabled || pagination.page === 1);

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-label={props["aria-label"] ?? "First page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setPage(1);
      }}
    />
  );
}
