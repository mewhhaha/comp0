import { Fragment, type ComponentProps, type FocusEvent, type PointerEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { usePreviewContext } from "./preview-shared.js";

export type PreviewTriggerProps = ComponentProps<"a"> & AsProp;

export function PreviewTrigger({
  as,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: PreviewTriggerProps) {
  const preview = usePreviewContext("PreviewTrigger");
  const triggerRef = useComposedRefs(ref, preview.setTriggerElement);
  const isNativeAnchor = as === undefined || as === "a";
  let ariaControls = props["aria-controls"];
  if (preview.open) ariaControls = ariaControls ?? preview.contentId;
  const Part = partElement(as, "a");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? preview.triggerId}
      // Focus must reach non-native triggers or the preview never opens for
      // keyboard users. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeAnchor || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      style={triggerAnchorStyle(preview.triggerId, style)}
      // The card can hold interactive content, so the trigger announces a
      // controlled expansion instead of a description (unlike a tooltip).
      aria-controls={ariaControls}
      aria-expanded={preview.open}
      data-open={dataAttr(preview.open)}
      data-slot={dataSlot(props, "preview-trigger")}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented) preview.setOpen(true);
      }}
      onBlur={(event: FocusEvent<HTMLAnchorElement>) => {
        onBlur?.(event);
        if (!event.defaultPrevented) preview.scheduleClose();
      }}
      onPointerEnter={(event: PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preview.scheduleOpen();
      }}
      onPointerLeave={(event: PointerEvent<HTMLAnchorElement>) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) preview.scheduleClose();
      }}
    />
  );
}
