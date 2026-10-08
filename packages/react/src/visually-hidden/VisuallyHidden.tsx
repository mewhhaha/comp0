import { type ComponentProps, type FocusEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFocusWithinReveal, visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type VisuallyHiddenProps = ComponentProps<"span"> &
  AsProp & {
    /** Removes the hiding styles while the element or a descendant has focus. */
    focusable?: boolean | undefined;
  };

export function VisuallyHidden({
  as,
  focusable,
  style,
  onFocus,
  onBlur,
  ...props
}: VisuallyHiddenProps) {
  const { revealed, reveal, conceal } = useFocusWithinReveal<HTMLSpanElement>();
  const hidden = !(focusable && revealed);
  let mergedStyle = style;
  if (hidden) mergedStyle = { ...visuallyHiddenStyle, ...style };

  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      data-slot="visually-hidden"
      style={mergedStyle}
      onFocus={(event: FocusEvent<HTMLSpanElement>) => {
        onFocus?.(event);
        if (focusable) reveal();
      }}
      onBlur={(event: FocusEvent<HTMLSpanElement>) => {
        onBlur?.(event);
        conceal(event);
      }}
    />
  );
}
