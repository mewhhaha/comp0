import { type RefProp } from "../shared.js";
import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { getToolbarControls } from "./parity-shared.js";
import { type ToolbarProps } from "./parity-shared.js";
export type { ToolbarProps } from "./parity-shared.js";
export function Toolbar({
  children,
  loop = true,
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  "aria-orientation": ariaOrientation,
  ref,
  ...props
}: ToolbarProps & RefProp<HTMLDivElement>) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  const syncTabStops = useCallback((activeIndex = activeIndexRef.current) => {
    const controls = getToolbarControls(rootRef.current);
    const boundedIndex = Math.max(0, Math.min(activeIndex, Math.max(controls.length - 1, 0)));
    activeIndexRef.current = boundedIndex;
    controls.forEach((control, index) => {
      control.tabIndex = index === boundedIndex ? 0 : -1;
    });
    return controls;
  }, []);
  const moveFocus = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, nextIndex: number) => {
      const controls = getToolbarControls(rootRef.current);
      if (!controls.length) return;
      let boundedIndex = Math.max(0, Math.min(nextIndex, controls.length - 1));
      if (loop) boundedIndex = (nextIndex + controls.length) % controls.length;

      event.preventDefault();
      syncTabStops(boundedIndex);
      controls[boundedIndex]?.focus();
    },
    [loop, syncTabStops],
  );

  useEffect(() => {
    syncTabStops();
  }, [children, syncTabStops]);

  return (
    <div
      {...props}
      role="toolbar"
      ref={(element) => {
        rootRef.current = element;
        composeRefs(ref)(element);
      }}
      aria-orientation={orientation === "vertical" ? "vertical" : ariaOrientation}
      data-orientation={orientation}
      data-slot="toolbar"
      onFocus={(event) => {
        onFocus?.(event);
        const controls = getToolbarControls(rootRef.current);
        const focusedIndex = controls.indexOf(event.target as HTMLElement);
        if (focusedIndex >= 0) syncTabStops(focusedIndex);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;

        const controls = getToolbarControls(rootRef.current);
        const focusedIndex = controls.indexOf(document.activeElement as HTMLElement);
        const activeIndex = focusedIndex >= 0 ? focusedIndex : activeIndexRef.current;
        const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
        const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

        if (event.key === previousKey) moveFocus(event, activeIndex - 1);
        else if (event.key === nextKey) moveFocus(event, activeIndex + 1);
        else if (event.key === "Home") moveFocus(event, 0);
        else if (event.key === "End") moveFocus(event, controls.length - 1);
      }}
    >
      {children}
    </div>
  );
}
