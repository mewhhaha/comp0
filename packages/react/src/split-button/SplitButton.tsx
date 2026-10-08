import { type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useRovingControls } from "../internal/roving-controls.js";

export type SplitButtonProps = ComponentProps<"div"> & AsProp;

/**
 * A split button: a default-action button beside a menu button that opens
 * alternative actions. It groups the two segments as one tab stop and roves
 * focus between them with the left and right arrow keys (Home and End too);
 * an open menu keeps its own keys. Name it with aria-label (or
 * aria-labelledby). Compose a Button and a Menu as the two segments; disable a
 * segment with its own disabled prop and the tab stop skips it.
 */
export function SplitButton({ as, onFocus, onKeyDown, ref, ...props }: SplitButtonProps) {
  const roving = useRovingControls<HTMLDivElement>("horizontal");

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composeRefs(ref, roving.containerRef)}
      role="group"
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
