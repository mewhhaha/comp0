import { createElement, Fragment, useMemo, useRef, useId } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { DialogContext, type DialogProps } from "./overlay-shared.js";
export type { DialogProps } from "./overlay-shared.js";

export function Dialog({
  as,
  children,
  defaultOpen = false,
  onToggle,
  open: openProp,
  ref,
  ...props
}: DialogProps & RefProp<HTMLElement>) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const context = useMemo(
    () => ({
      open,
      setOpen,
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
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "dialog") },
      children,
    );
  }

  return <DialogContext.Provider value={context}>{root}</DialogContext.Provider>;
}
