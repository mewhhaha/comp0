import {
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useComposedRefs } from "@comp0/core";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useOverlaySurface, type PopoverPlacementProps } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOptionalContextMenuContext, useMenuRootContext } from "./menu-shared.js";

export type MenuPopoverProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function MenuPopover({
  as,
  id,
  ref,
  offset,
  onContextMenu,
  onContextMenuCapture,
  onKeyDown,
  onToggle,
  onBlur,
  placement,
  style,
  ...props
}: MenuPopoverProps) {
  const autocomplete = useAutocompleteContext();
  const menu = useMenuRootContext("MenuPopover");
  const contextMenu = useOptionalContextMenuContext();
  const ownContextMenu = contextMenu !== null && contextMenu.contentId === menu.contentId;
  const popoverRef = useComposedRefs(ref, menu.setSurfaceElement);

  let surfaceStyle = style;
  if (ownContextMenu) {
    // Positioning stays consumer CSS, for example:
    // position: fixed; left: var(--comp0-context-menu-x); top: var(--comp0-context-menu-y)
    surfaceStyle = {
      "--comp0-context-menu-x": `${contextMenu.position.x}px`,
      "--comp0-context-menu-y": `${contextMenu.position.y}px`,
      ...style,
    } as CSSProperties;
  }

  const surface = useOverlaySurface<HTMLDivElement>({
    popover: "auto",
    offset,
    onToggle,
    placement,
    ref: popoverRef,
    style: surfaceStyle,
    initialFocus() {
      // The menu owns which item takes focus (first, last, or the input).
      menu.focusInitial();
      return null;
    },
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      // The surface's context id is the list's id; the popover keeps only its own.
      id={id}
      onContextMenu={onContextMenu}
      onContextMenuCapture={(event: MouseEvent<HTMLDivElement>) => {
        onContextMenuCapture?.(event);
        if (!event.defaultPrevented && ownContextMenu) event.preventDefault();
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        // The menu follows focus: a submenu closes when focus moves to a
        // different parent item, and any menu closes when focus tabs out
        // of the surface and its trigger entirely.
        if (!menu.open) return;
        const next = event.relatedTarget;
        if (next === autocomplete?.inputRef.current) return;
        if (next instanceof Node) {
          if (event.currentTarget.contains(next)) return;
          const trigger = event.currentTarget.ownerDocument.getElementById(menu.triggerId);
          if (trigger?.contains(next)) return;
          menu.setOpen(false);
          return;
        }
        // Without a focus destination only a submenu follows the blur, so
        // pointer light dismiss keeps handling the root menu.
        if (menu.isSubmenu) menu.setOpen(false);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        const targetSurface =
          event.target instanceof Element ? event.target.closest("[popover]") : null;
        if (targetSurface !== event.currentTarget) return;
        event.preventDefault();
        menu.setOpen(false);
        menu.focusTrigger();
      }}
    />
  );
}
