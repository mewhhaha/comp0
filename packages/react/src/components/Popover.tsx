import { createElement, Fragment, useId } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { PopoverContext, usePopoverState, type PopoverProps } from "./overlay-shared.js";
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
  const baseId = props.id ?? generatedId;
  const context = usePopoverState({
    open: openProp,
    defaultOpen,
    onToggle,
    triggerId: `${baseId}-trigger`,
    contentId: `${baseId}-content`,
  });
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(
      as,
      {
        ...props,
        ref,
        "data-open": dataAttr(context.open),
        "data-slot": dataSlot(props, "popover"),
      },
      children,
    );
  }

  return <PopoverContext value={context}>{root}</PopoverContext>;
}
