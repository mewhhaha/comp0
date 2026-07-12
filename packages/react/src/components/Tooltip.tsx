import { createElement, Fragment, useEffect, useId, useMemo, useRef } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { PopoverContext, TooltipContext, type TooltipProps } from "./overlay-shared.js";
export type { TooltipProps } from "./overlay-shared.js";

export function Tooltip({
  as,
  children,
  defaultOpen = false,
  onToggle,
  open: openProp,
  ref,
  ...props
}: TooltipProps & RefProp<HTMLElement>) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const context = useMemo(
    () => ({
      open,
      setOpen(next: boolean) {
        window.clearTimeout(closeTimer.current);
        setOpen(next);
      },
      // A short close delay keeps the tooltip hoverable: the pointer can
      // travel from the trigger onto the tooltip content (WCAG 1.4.13).
      cancelClose() {
        window.clearTimeout(closeTimer.current);
      },
      scheduleClose() {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 150);
      },
      triggerId: `${props.id ?? generatedId}-trigger`,
      contentId: `${props.id ?? generatedId}-content`,
      focusTrigger() {
        triggerRef.current?.focus();
      },
      setTriggerElement(element: HTMLElement | null) {
        triggerRef.current = element;
      },
    }),
    [generatedId, open, props.id, setOpen],
  );
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  // Escape dismisses an open tooltip no matter where focus is (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, setOpen]);
  // Tooltips compose with the popover system internally so TooltipPopover
  // can live in the top layer instead of expanding its container.
  const popoverContext = useMemo(
    () => ({
      ...context,
      requestClose() {
        context.setOpen(false);
      },
    }),
    [context],
  );
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "tooltip") },
      children,
    );
  }
  return (
    <TooltipContext.Provider value={context}>
      <PopoverContext.Provider value={popoverContext}>{root}</PopoverContext.Provider>
    </TooltipContext.Provider>
  );
}
