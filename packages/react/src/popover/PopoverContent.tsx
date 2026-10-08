import { type ComponentProps, type KeyboardEvent } from "react";
import {
  useOverlaySurface,
  useRequiredPopoverContext,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

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
    // The surface announces as a dialog, so opening must move focus into it;
    // Escape-to-close and screen-reader context depend on focus being inside.
    initialFocus(element) {
      if (element.contains(element.ownerDocument.activeElement)) return undefined;
      return (
        element.querySelector<HTMLElement>("[autofocus]") ??
        element.querySelector<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) ??
        element
      );
    },
  });
  const popover = useRequiredPopoverContext("PopoverContent");
  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="popover-content"
      {...props}
      {...surface.props}
      role={props.role ?? "dialog"}
      tabIndex={props.tabIndex ?? -1}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        popover.requestClose();
      }}
    />
  );
}
