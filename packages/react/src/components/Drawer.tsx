import { createElement, Fragment, useRef, useId } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { DrawerContext, type DrawerSide } from "./drawer-shared.js";
import type { DialogProps } from "./overlay-shared.js";

export type DrawerProps = DialogProps & {
  /** Edge of the viewport the panel is anchored to; swiping toward it dismisses the drawer. */
  side?: DrawerSide | undefined;
};

export function Drawer({
  as,
  children,
  defaultOpen = false,
  onToggle,
  open: openProp,
  ref,
  side = "right",
  ...props
}: DrawerProps & RefProp<HTMLElement>) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const context = {
    open,
    setOpen,
    side,
    triggerId: `${props.id ?? generatedId}-trigger`,
    contentId: `${props.id ?? generatedId}-content`,
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
      { ...props, ref, "data-open": dataAttr(open), "data-slot": dataSlot(props, "drawer") },
      children,
    );
  }

  return <DrawerContext value={context}>{root}</DrawerContext>;
}
