import { type ElementType } from "react";
import { Button, type ButtonProps } from "../button/Button.js";
import { Link, type LinkProps } from "../link/Link.js";

export type PaginationControlProps<TElement extends ElementType = "button"> = Omit<
  ButtonProps<TElement>,
  "command" | "commandfor" | "pending"
>;

export function PaginationControl<TElement extends ElementType = "button">({
  as,
  ...props
}: PaginationControlProps<TElement>) {
  if (as && as !== "button") {
    return <Link {...(props as LinkProps<TElement>)} as={as} />;
  }
  return <Button {...(props as ButtonProps<"button">)} />;
}
