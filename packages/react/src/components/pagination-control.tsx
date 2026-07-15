import { type ElementType } from "react";
import { Button, type ButtonProps } from "./Button.js";
import { Link, type LinkProps } from "./Link.js";

export type PaginationControlProps<TElement extends ElementType = "button"> = ButtonProps<TElement>;

export function PaginationControl<TElement extends ElementType = "button">({
  as,
  ...props
}: PaginationControlProps<TElement>) {
  if (as && as !== "button") {
    return <Link {...(props as LinkProps<TElement>)} as={as} />;
  }
  return <Button {...(props as ButtonProps<"button">)} />;
}
