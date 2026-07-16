import {
  createElement,
  Fragment,
  useEffect,
  useId,
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { PopoverContext } from "./overlay-shared.js";
import { PreviewContext } from "./preview-shared.js";

export type PreviewProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  /** Milliseconds the pointer must rest on the trigger before the preview opens; focus opens immediately. */
  openDelay?: number | undefined;
  /** Milliseconds after the pointer or focus leaves before the preview closes. */
  closeDelay?: number | undefined;
  children?: ReactNode | undefined;
};

export function Preview({
  as,
  children,
  closeDelay = 300,
  defaultOpen = false,
  onToggle,
  open: openProp,
  openDelay = 600,
  ref,
  ...props
}: PreviewProps & RefProp<HTMLElement>) {
  if (openDelay < 0 || closeDelay < 0) {
    throw new Error(
      `Preview delays must be non-negative; received openDelay ${openDelay} and closeDelay ${closeDelay}.`,
    );
  }
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const intentTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const context = {
    open,
    setOpen(next: boolean) {
      window.clearTimeout(intentTimer.current);
      setOpen(next);
    },
    // Opening waits for hover intent so a pointer passing over the trigger
    // does not flash the card; closing waits so the pointer can travel from
    // the trigger onto the card (WCAG 1.4.13).
    scheduleOpen() {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = window.setTimeout(() => setOpen(true), openDelay);
    },
    scheduleClose() {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = window.setTimeout(() => setOpen(false), closeDelay);
    },
    cancelClose() {
      window.clearTimeout(intentTimer.current);
    },
    triggerId: `${props.id ?? generatedId}-trigger`,
    contentId: `${props.id ?? generatedId}-content`,
    setTriggerElement(element: HTMLElement | null) {
      triggerRef.current = element;
    },
  };
  useEffect(() => () => window.clearTimeout(intentTimer.current), []);
  // Escape dismisses an open preview no matter where focus is (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    const ownerDocument = triggerRef.current?.ownerDocument;
    if (!ownerDocument) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    ownerDocument.addEventListener("keydown", onKeyDown, true);
    return () => ownerDocument.removeEventListener("keydown", onKeyDown, true);
  }, [open, setOpen]);
  // Previews compose with the popover system internally so PreviewPopover
  // can live in the top layer instead of expanding its container.
  const popoverContext = {
    ...context,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    requestClose() {
      context.setOpen(false);
    },
  };
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "preview") },
      children,
    );
  }
  return (
    <PreviewContext value={context}>
      <PopoverContext value={popoverContext}>{root}</PopoverContext>
    </PreviewContext>
  );
}
