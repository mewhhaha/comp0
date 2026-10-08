import { useLayoutEffect, useRef } from "react";
import { useControllableState } from "@comp0/core";
import { type PopoverContextValue } from "./context.js";

/**
 * The open-state half of a popover: controllable open state, a trigger ref for
 * focus restore, and requestClose (close and return focus to the trigger).
 * Popover provides this, and so do the picker roots (Select, Combobox,
 * DatePicker) so their surfaces work without a separate Popover wrapper.
 */
export function usePopoverState(options: {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  triggerId: string;
  contentId: string;
}): PopoverContextValue {
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const wasOpen = useRef(false);
  const [open, setOpenState] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });
  const setOpen = (nextOpen: boolean) => {
    if (!nextOpen) restoreFocus.current = false;
    setOpenState(nextOpen);
  };
  const requestClose = () => {
    restoreFocus.current = true;
    setOpenState(false);
  };
  useLayoutEffect(() => {
    if (wasOpen.current && !open && restoreFocus.current) triggerRef.current?.focus();
    if (!open) restoreFocus.current = false;
    wasOpen.current = open;
  }, [open]);
  return {
    open,
    setOpen,
    requestClose,
    triggerId: options.triggerId,
    contentId: options.contentId,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    setTriggerElement(element) {
      triggerRef.current = element;
    },
  };
}
