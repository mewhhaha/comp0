import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ToggleEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOptionalContextMenuContext, useMenuRootContext } from "./menu-shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";

export type MenuPopoverProps = ComponentProps<"div"> & AsProp & PopoverPlacementProps;

export function MenuPopover({
  as,
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
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const wasOpen = useRef(false);
  const popoverRef = useComposedRefs(surfaceRef, ref, menu.setSurfaceElement);

  useLayoutEffect(() => {
    if (menu.open && !wasOpen.current) menu.focusInitial();
    wasOpen.current = Boolean(menu.open);
  });

  let surfaceStyle = placementSurfaceStyle(placement, offset, menu.triggerId, style);
  if (ownContextMenu) {
    // Positioning stays consumer CSS, for example:
    // position: fixed; left: var(--comp0-context-menu-x); top: var(--comp0-context-menu-y)
    surfaceStyle = {
      "--comp0-context-menu-x": `${contextMenu.position.x}px`,
      "--comp0-context-menu-y": `${contextMenu.position.y}px`,
      ...surfaceStyle,
    } as CSSProperties;
  }

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={popoverRef}
      popover="auto"
      hidden={!menu.open}
      style={surfaceStyle}
      data-open={dataAttr(menu.open)}
      onContextMenu={onContextMenu}
      onContextMenuCapture={(event: MouseEvent<HTMLDivElement>) => {
        onContextMenuCapture?.(event);
        if (!event.defaultPrevented && ownContextMenu) event.preventDefault();
      }}
      onToggle={(event: ToggleEvent<HTMLDivElement>) => {
        onToggle?.(event);
        // Toggle events from nested popovers bubble in the React tree;
        // only this surface's own toggles drive its state.
        if (event.target !== event.currentTarget) return;
        if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
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
