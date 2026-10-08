import { useEffect, useId, useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
import { PopoverContext, useEscapeDismiss } from "../internal/overlay/index.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { PreviewContext } from "./preview-shared.js";

export type PreviewProps = RootProps<{
  /** Base for the generated trigger and content ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Milliseconds the pointer must rest on the trigger before the preview opens; focus opens immediately. */
  openDelay?: number | undefined;
  /** Milliseconds after the pointer or focus leaves before the preview closes. */
  closeDelay?: number | undefined;
  children?: ReactNode | undefined;
}>;

export function Preview({
  as,
  children,
  closeDelay = 300,
  defaultOpen = false,
  id,
  onOpenChange,
  open: openProp,
  openDelay = 600,
  ...props
}: PreviewProps) {
  if (openDelay < 0 || closeDelay < 0) {
    warnOnce(
      `Preview:negative-delay:${openDelay}:${closeDelay}`,
      `Preview delays must be non-negative; received openDelay ${openDelay} and closeDelay ${closeDelay}. Negative delays were treated as 0.`,
    );
  }
  const openDelayMs = Math.max(0, openDelay);
  const closeDelayMs = Math.max(0, closeDelay);
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const intentTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
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
      intentTimer.current = window.setTimeout(() => setOpen(true), openDelayMs);
    },
    scheduleClose() {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = window.setTimeout(() => setOpen(false), closeDelayMs);
    },
    cancelClose() {
      window.clearTimeout(intentTimer.current);
    },
    triggerId: `${id ?? generatedId}-trigger`,
    contentId: `${id ?? generatedId}-content`,
    setTriggerElement(element: HTMLElement | null) {
      triggerRef.current = element;
    },
  };
  useEffect(() => () => window.clearTimeout(intentTimer.current), []);
  useEscapeDismiss(open, triggerRef, setOpen);
  // Previews compose with the popover system internally so PreviewContent
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
  const Root = rootElement(as);
  return (
    <PreviewContext value={context}>
      <PopoverContext value={popoverContext}>
        <Root data-slot="preview" {...props} id={id} data-open={dataAttr(open)}>
          {children}
        </Root>
      </PopoverContext>
    </PreviewContext>
  );
}
