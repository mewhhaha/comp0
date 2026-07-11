import {
  createElement,
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
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
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) restoreFocus.current = false;
      setOpenState(nextOpen);
    },
    [setOpenState],
  );
  const requestClose = useCallback(() => {
    restoreFocus.current = true;
    setOpenState(false);
  }, [setOpenState]);
  useLayoutEffect(() => {
    if (wasOpen.current && !open && restoreFocus.current) triggerRef.current?.focus();
    if (!open) restoreFocus.current = false;
    wasOpen.current = open;
  }, [open]);
  const context = useMemo(
    () => ({
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
    }),
    [generatedId, open, picker?.listBoxId, picker?.triggerId, props.id, requestClose, setOpen],
  );
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "popover") },
      children,
    );
  }

  return <PopoverContext.Provider value={context}>{root}</PopoverContext.Provider>;
}
