import { type ElementType, type MouseEvent as ReactMouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type ButtonProps } from "../button/Button.js";
import { PaginationControl } from "./pagination-control.js";
import { usePaginationContext } from "./pagination-shared.js";

type PaginationPageOwnProps = {
  /** The page this control selects, starting at 1. */
  value: number;
};

export type PaginationPageProps<TElement extends ElementType = "button"> = PaginationPageOwnProps &
  Omit<ButtonProps<TElement>, keyof PaginationPageOwnProps>;

export function PaginationPage<TElement extends ElementType = "button">({
  value,
  onClick,
  ...props
}: PaginationPageProps<TElement>) {
  const pagination = usePaginationContext("PaginationPage");
  const current = value === pagination.value;

  return (
    <PaginationControl
      {...(props as ButtonProps<ElementType>)}
      aria-current={current ? "page" : undefined}
      aria-label={props["aria-label"] ?? `Page ${value}`}
      data-current={dataAttr(current)}
      data-page={value}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        (onClick as ((clickEvent: ReactMouseEvent<HTMLElement>) => void) | undefined)?.(event);
        if (!event.defaultPrevented) pagination.setValue(value);
      }}
    />
  );
}
