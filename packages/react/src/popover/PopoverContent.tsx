import { useLayoutEffect, useRef, type ComponentProps, type KeyboardEvent } from "react";
import {
  useOverlaySurface,
  useRequiredPopoverContext,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type PopoverContentProps = Omit<ComponentProps<"div">, "popover"> &
  AsProp &
  PopoverPlacementProps & {
    /** Native popover mode; `none` renders in normal flow instead of the top layer. */
    popover?: "auto" | "manual" | "none" | undefined;
  };

export function PopoverContent({
  as,
  hidden,
  offset,
  onKeyDown,
  onToggle,
  placement,
  popover: popoverProp = "auto",
  ref,
  style,
  ...props
}: PopoverContentProps) {
  // Top layer by default, matching SelectPopover; pass popover="none" to
  // render in normal flow instead.
  const surface = useOverlaySurface<HTMLDivElement>({
    popover: popoverProp === "none" ? undefined : popoverProp,
    id: props.id,
    hidden,
    offset,
    onToggle,
    placement,
    ref,
    style,
  });
  const popover = useRequiredPopoverContext("PopoverContent");
  const { open, surfaceRef } = surface;
  const wasOpen = useRef(false);
  // The surface announces as a dialog, so opening must move focus into it;
  // Escape-to-close and screen-reader context depend on focus being inside.
  useLayoutEffect(() => {
    const element = surfaceRef.current;
    if (open && !wasOpen.current && element) {
      if (!element.contains(element.ownerDocument.activeElement)) {
        const target =
          element.querySelector<HTMLElement>("[autofocus]") ??
          element.querySelector<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
          ) ??
          element;
        target.focus();
      }
    }
    wasOpen.current = open;
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      role={props.role ?? "dialog"}
      tabIndex={props.tabIndex ?? -1}
      data-slot={dataSlot(props, "popover-content")}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        popover.requestClose();
      }}
    />
  );
}
