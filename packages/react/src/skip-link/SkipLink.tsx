import { type ComponentProps, type ElementType, type FocusEvent } from "react";
import { dataAttr } from "@comp0/core";
import { partElement } from "../internal/polymorphic.js";
import {
  useFocusWithinReveal,
  visuallyHiddenStyle,
} from "../visually-hidden/visually-hidden-shared.js";

type SkipLinkOwnProps = {
  /** In-page target the link jumps to, such as "#main". */
  href: string;
};

export type SkipLinkProps<TElement extends ElementType = "a"> = SkipLinkOwnProps &
  Omit<ComponentProps<TElement>, keyof SkipLinkOwnProps | "as"> & {
    as?: TElement | undefined;
  };

export function SkipLink<TElement extends ElementType = "a">({
  as,
  style,
  onFocus,
  onBlur,
  ...props
}: SkipLinkProps<TElement>) {
  const { revealed, reveal, conceal } = useFocusWithinReveal<HTMLAnchorElement>();
  let mergedStyle = style;
  if (!revealed) mergedStyle = { ...visuallyHiddenStyle, ...style };

  const Part = partElement(as, "a");
  return (
    <Part
      {...props}
      data-slot="skip-link"
      data-focused={dataAttr(revealed)}
      style={mergedStyle}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        reveal();
      }}
      onBlur={(event: FocusEvent<HTMLAnchorElement>) => {
        onBlur?.(event);
        conceal(event);
      }}
    />
  );
}
