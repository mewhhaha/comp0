import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type ButtonProps } from "./Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

type PaginationPageOwnProps = {
  page: number;
};

export type PaginationPageProps<TElement extends ElementType = "button"> = PaginationPageOwnProps &
  Omit<ButtonProps<TElement>, keyof PaginationPageOwnProps>;

export function PaginationPage<TElement extends ElementType = "button">({
  page,
  onClick,
  ...props
}: PaginationPageProps<TElement>) {
  const pagination = usePaginationContext("PaginationPage");
  const current = page === pagination.page;

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-current={current ? "page" : undefined}
      aria-label={props["aria-label"] ?? `Page ${page}`}
      data-current={dataAttr(current)}
      data-page={page}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setPage(page);
      }}
    />
  );
}
