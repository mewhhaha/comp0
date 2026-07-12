import { type HTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useRovingControls } from "./roving-controls.js";

export type SplitButtonProps = HTMLAttributes<HTMLDivElement>;

/**
 * A split button: a default-action button beside a menu button that opens
 * alternative actions. It groups the two segments as one tab stop and roves
 * focus between them with the left and right arrow keys (Home and End too);
 * an open menu keeps its own keys. Name it with aria-label (or
 * aria-labelledby). Compose a Button and a Menu as the two segments; disable a
 * segment with its own disabled prop and the tab stop skips it.
 */
export function SplitButton({
  onFocus,
  onKeyDown,
  ref,
  ...props
}: SplitButtonProps & RefProp<HTMLDivElement>) {
  const roving = useRovingControls<HTMLDivElement>("horizontal");

  return (
    <div
      {...props}
      ref={composeRefs(ref, roving.containerRef)}
      role="group"
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
