import { type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useRovingControls } from "../internal/roving-controls.js";

export type ToolbarProps = ComponentProps<"div"> &
  AsProp & {
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
  as,
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  ref,
  ...props
}: ToolbarProps) {
  const roving = useRovingControls<HTMLDivElement>(orientation);

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composeRefs(ref, roving.containerRef)}
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        roving.onFocus(event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        roving.onKeyDown(event);
      }}
    />
  );
}
