import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useFocusWithinReveal, visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement> & {
  /** Removes the hiding styles while the element or a descendant has focus. */
  focusable?: boolean | undefined;
};

export function VisuallyHidden({
  focusable,
  style,
  onFocus,
  onBlur,
  ref,
  ...props
}: VisuallyHiddenProps & RefProp<HTMLSpanElement>) {
  const { revealed, reveal, conceal } = useFocusWithinReveal<HTMLSpanElement>();
  const hidden = !(focusable && revealed);
  let mergedStyle = style;
  if (hidden) mergedStyle = { ...visuallyHiddenStyle, ...style };

  return (
    <span
      {...props}
      ref={ref}
      data-slot="visually-hidden"
      style={mergedStyle}
      onFocus={(event) => {
        onFocus?.(event);
        if (focusable) reveal();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        conceal(event);
      }}
    />
  );
}
