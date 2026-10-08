import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { type ButtonProps } from "../button/Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

export type PaginationLastProps<TElement extends ElementType = "button"> = ButtonProps<TElement>;

export function PaginationLast<TElement extends ElementType = "button">({
  disabled,
  onClick,
  ...props
}: PaginationLastProps<TElement>) {
  const pagination = usePaginationContext("PaginationLast");
  const resolvedDisabled = Boolean(disabled || pagination.value === pagination.totalPages);

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-label={props["aria-label"] ?? "Last page"}
      disabled={resolvedDisabled}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setValue(pagination.totalPages);
      }}
    />
  );
}
