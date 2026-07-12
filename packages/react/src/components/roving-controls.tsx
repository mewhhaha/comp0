import { useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent } from "react";
import { getRovingFocusTarget } from "@comp0/core";
import { rowFocusables } from "./grid-list-shared.js";

const NESTED_COMPOSITE_SELECTOR = "[role='listbox'],[role='grid'],[role='menu']";

/** A container's roving controls: visible focusables outside nested composites. */
export function rovingControls(container: HTMLElement) {
  return rowFocusables(container).filter((element) => {
    if (element.closest("[hidden]")) return false;
    const composite = element.closest(NESTED_COMPOSITE_SELECTOR);
    return !composite || !container.contains(composite);
  });
}

/**
 * One tab stop whose focus roves across a container's controls with the arrow
 * keys (Home and End too). Nested composites such as a listbox, grid, or menu
 * keep their own keys and manage their own focus. Shared by Toolbar and
 * SplitButton; the caller owns the role and chains its own event handlers
 * before the returned ones.
 */
export function useRovingControls<T extends HTMLElement = HTMLElement>(
  orientation: "horizontal" | "vertical",
) {
  const containerRef = useRef<T | null>(null);
  const activeControlRef = useRef<HTMLElement | null>(null);

  const syncTabStops = (container: HTMLElement, next?: HTMLElement) => {
    const controls = rovingControls(container);
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
    if (containerRef.current) syncTabStops(containerRef.current);
  });

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || target === event.currentTarget) return;
    const control = rovingControls(event.currentTarget).find(
      (element) => element === target || element.contains(target),
    );
    if (control && control !== activeControlRef.current) {
      syncTabStops(event.currentTarget, control);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    // Nested composites own their arrow, Home, and End keys.
    const composite = target.closest(NESTED_COMPOSITE_SELECTOR);
    if (composite && event.currentTarget.contains(composite)) return;
    const controls = rovingControls(event.currentTarget);
    const currentIndex = controls.findIndex(
      (element) => element === target || element.contains(target),
    );
    if (currentIndex === -1) return;
    const items = controls.map((_, index) => ({ key: String(index) }));
    // APG: arrows may stop at the ends, so no looping.
    const targetKey = getRovingFocusTarget(items, String(currentIndex), event.key, { orientation });
    if (targetKey === undefined) return;
    event.preventDefault();
    const nextControl = controls[Number(targetKey)];
    if (nextControl && nextControl !== target) nextControl.focus();
  };

  return { containerRef, onFocus, onKeyDown };
}
