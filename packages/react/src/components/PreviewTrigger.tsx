import { createElement, Fragment, type AnchorHTMLAttributes, type ElementType } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { triggerAnchorStyle } from "./overlay-shared.js";
import { usePreviewContext } from "./preview-shared.js";

export type PreviewTriggerProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  as?: ElementType | typeof Fragment | undefined;
};

export function PreviewTrigger({
  as,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: PreviewTriggerProps & RefProp<HTMLAnchorElement>) {
  const preview = usePreviewContext();
  const triggerRef = useComposedRefs(ref, preview?.setTriggerElement);
  const Trigger = as === Fragment ? Slot : (as ?? "a");
  const isNativeAnchor = Trigger === "a";
  let ariaControls = props["aria-controls"];
  if (preview?.open) ariaControls = ariaControls ?? preview.contentId;
  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? preview?.triggerId,
    // Focus must reach non-native triggers or the preview never opens for
    // keyboard users. Fragment triggers keep their own element's focusability.
    tabIndex: isNativeAnchor || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0),
    style: triggerAnchorStyle(preview?.triggerId, style),
    // The card can hold interactive content, so the trigger announces a
    // controlled expansion instead of a description (unlike a tooltip).
    "aria-controls": ariaControls,
    "aria-expanded": preview?.open,
    "data-open": dataAttr(preview?.open),
    "data-slot": dataSlot(props, "preview-trigger"),
    onFocus(event: React.FocusEvent<HTMLAnchorElement>) {
      onFocus?.(event);
      if (!event.defaultPrevented) preview?.setOpen(true);
    },
    onBlur(event: React.FocusEvent<HTMLAnchorElement>) {
      onBlur?.(event);
      if (!event.defaultPrevented) preview?.scheduleClose();
    },
    onPointerEnter(event: React.PointerEvent<HTMLAnchorElement>) {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) preview?.scheduleOpen();
    },
    onPointerLeave(event: React.PointerEvent<HTMLAnchorElement>) {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) preview?.scheduleClose();
    },
  });
}
