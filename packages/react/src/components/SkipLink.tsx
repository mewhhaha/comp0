import { type AnchorHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useFocusWithinReveal, visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type SkipLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** In-page target the link jumps to, such as "#main". */
  href: string;
};

export function SkipLink({
  children,
  style,
  onFocus,
  onBlur,
  ref,
  ...props
}: SkipLinkProps & RefProp<HTMLAnchorElement>) {
  const { revealed, reveal, conceal } = useFocusWithinReveal<HTMLAnchorElement>();
  let mergedStyle = style;
  if (!revealed) mergedStyle = { ...visuallyHiddenStyle, ...style };

  return (
    <a
      {...props}
      ref={ref}
      data-slot="skip-link"
      data-focused={dataAttr(revealed)}
      style={mergedStyle}
      onFocus={(event) => {
        onFocus?.(event);
        reveal();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        conceal(event);
      }}
    >
      {children}
    </a>
  );
}
