import { type ComponentProps, type FocusEvent, type PointerEvent } from "react";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { usePreviewContext } from "./preview-shared.js";

export type PreviewContentProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function PreviewContent({
  as,
  hidden,
  offset,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: PreviewContentProps) {
  const preview = usePreviewContext("PreviewContent");
  // Manual mode keeps the card in the top layer without light dismiss;
  // the trigger's hover and focus handlers own the open state.
  const surface = useOverlaySurface<HTMLDivElement>({
    popover: "manual",
    id: props.id,
    hidden,
    offset,
    onToggle,
    placement,
    ref,
    style,
  });
  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="preview-content"
      {...props}
      {...surface.props}
      // Hovering the card keeps the preview open (WCAG 1.4.13).
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preview.cancelClose();
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) preview.scheduleClose();
      }}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented) preview.cancelClose();
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (event.defaultPrevented) return;
        // Focus moving between elements inside the card keeps it open; only
        // focus leaving the card schedules the close.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        preview.scheduleClose();
      }}
    />
  );
}
