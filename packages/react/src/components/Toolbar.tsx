import { useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { composeRefs, getRovingFocusTarget } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { rowFocusables } from "./grid-list-shared.js";

const NESTED_COMPOSITE_SELECTOR = "[role='listbox'],[role='grid'],[role='menu']";

/** The toolbar's roving controls: visible focusables outside nested composites. */
function toolbarControls(toolbar: HTMLElement) {
  return rowFocusables(toolbar).filter((element) => {
    if (element.closest("[hidden]")) return false;
    const composite = element.closest(NESTED_COMPOSITE_SELECTOR);
    return !composite || !toolbar.contains(composite);
  });
}

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
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const activeControlRef = useRef<HTMLElement | null>(null);

  const syncTabStops = (toolbar: HTMLElement, next?: HTMLElement) => {
    const controls = toolbarControls(toolbar);
    let active: HTMLElement | null = next ?? activeControlRef.current;
    if (!active || !controls.includes(active)) active = controls[0] ?? null;
    activeControlRef.current = active;
    for (const control of controls) {
      let tabIndex = -1;
      if (control === active) tabIndex = 0;
      control.tabIndex = tabIndex;
    }
  };

  // Keep exactly one tab stop as controls mount, unmount, or change state.
  useLayoutEffect(() => {
    if (toolbarRef.current) syncTabStops(toolbarRef.current);
  });

  return (
    <div
      {...props}
      ref={composeRefs(ref, toolbarRef)}
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (!target || target === event.currentTarget) return;
        const control = toolbarControls(event.currentTarget).find(
          (element) => element === target || element.contains(target),
        );
        if (control && control !== activeControlRef.current) {
          syncTabStops(event.currentTarget, control);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (!target) return;
        // Nested composites own their arrow, Home, and End keys.
        const composite = target.closest(NESTED_COMPOSITE_SELECTOR);
        if (composite && event.currentTarget.contains(composite)) return;
        const controls = toolbarControls(event.currentTarget);
        const currentIndex = controls.findIndex(
          (element) => element === target || element.contains(target),
        );
        if (currentIndex === -1) return;
        const items = controls.map((_, index) => ({ key: String(index) }));
        // APG: a toolbar's arrows may stop at the ends, so no looping.
        const targetKey = getRovingFocusTarget(items, String(currentIndex), event.key, {
          orientation,
        });
        if (targetKey === undefined) return;
        event.preventDefault();
        const nextControl = controls[Number(targetKey)];
        if (nextControl && nextControl !== target) nextControl.focus();
      }}
    />
  );
}
