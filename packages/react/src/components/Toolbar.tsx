import { type HTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useRovingControls } from "./roving-controls.js";

export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  /** Arrow keys follow this direction; announced via aria-orientation. */
  orientation?: "horizontal" | "vertical" | undefined;
};

/**
 * APG toolbar: one tab stop whose focus roves across the toolbar's controls
 * with the arrow keys. Name it with aria-label (or aria-labelledby). Nested
 * composites such as a listbox, grid, or menu keep their own arrow keys and
 * manage their own focus; the toolbar leaves them alone.
 */
export function Toolbar({
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  ref,
  ...props
}: ToolbarProps & RefProp<HTMLDivElement>) {
  const roving = useRovingControls<HTMLDivElement>(orientation);

  return (
    <div
      {...props}
      ref={composeRefs(ref, roving.containerRef)}
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        roving.onFocus(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        roving.onKeyDown(event);
      }}
    />
  );
}
