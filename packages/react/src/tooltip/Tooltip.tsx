import { useEffect, useId, useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { PopoverContext, TooltipContext, useEscapeDismiss } from "../internal/overlay/index.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";

export type TooltipProps = RootProps<{
  /** Base for the generated trigger and content ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Tooltip({
  as,
  children,
  defaultOpen = false,
  id,
  onOpenChange,
  open: openProp,
  ...props
}: TooltipProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const context = {
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
    triggerId: `${baseId}-trigger`,
    contentId: `${baseId}-content`,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    setTriggerElement(element: HTMLElement | null) {
      triggerRef.current = element;
    },
  };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useEscapeDismiss(open, triggerRef, setOpen);
  // Tooltips compose with the popover system internally so TooltipContent
  // can live in the top layer instead of expanding its container.
  const popoverContext = {
    ...context,
    requestClose() {
      context.setOpen(false);
    },
  };

  const Root = rootElement(as);
  return (
    <TooltipContext value={context}>
      <PopoverContext value={popoverContext}>
        <Root data-slot="tooltip" {...props} id={id} data-open={dataAttr(open)}>
          {children}
        </Root>
      </PopoverContext>
    </TooltipContext>
  );
}
