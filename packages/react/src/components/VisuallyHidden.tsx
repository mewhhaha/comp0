import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useFocusWithinReveal, visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type VisuallyHiddenProps = HTMLAttributes<HTMLDivElement> & {
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
}: VisuallyHiddenProps & RefProp<HTMLDivElement>) {
  const { revealed, reveal, conceal } = useFocusWithinReveal<HTMLDivElement>();
  const hidden = !(focusable && revealed);
  let mergedStyle = style;
  if (hidden) mergedStyle = { ...visuallyHiddenStyle, ...style };

  return (
    <div
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
