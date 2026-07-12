import { createElement, Fragment, useId, useLayoutEffect, useRef } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { usePickerRootContext } from "../shared.js";
import { PopoverContext, type PopoverProps } from "./overlay-shared.js";
export type { PopoverProps } from "./overlay-shared.js";

export function Popover({
  as,
  children,
  defaultOpen = false,
  onToggle,
  open: openProp,
  ref,
  ...props
}: PopoverProps & RefProp<HTMLElement>) {
  const generatedId = useId();
  const picker = usePickerRootContext();
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const wasOpen = useRef(false);
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
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
  const context = {
    open,
    setOpen,
    requestClose,
    triggerId: picker?.triggerId ?? `${props.id ?? generatedId}-trigger`,
    contentId: picker?.listBoxId ?? `${props.id ?? generatedId}-content`,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    setTriggerElement(element: HTMLElement | null) {
      triggerRef.current = element;
    },
  };
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "popover") },
      children,
    );
  }

  return <PopoverContext value={context}>{root}</PopoverContext>;
}
