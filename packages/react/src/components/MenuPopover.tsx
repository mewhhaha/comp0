import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { composeRefs } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { useContextMenuContext, useMenuRootContext, type MenuPopoverProps } from "./menu-shared.js";
import { placementSurfaceStyle, usePopoverSurface } from "./overlay-shared.js";

export type { MenuPopoverProps } from "./menu-shared.js";

export function MenuPopover({
  ref,
  offset,
  onContextMenu,
  onContextMenuCapture,
  onKeyDown,
  onToggle,
  onBlur,
  placement,
  style,
  children,
  ...props
}: MenuPopoverProps & RefProp<HTMLDivElement>) {
  const autocomplete = useAutocompleteContext();
  const menu = useMenuRootContext();
  const contextMenu = useContextMenuContext();
  const ownContextMenu = contextMenu !== null && contextMenu.contentId === menu?.contentId;
  const { onNativeToggle, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const wasOpen = useRef(false);

  useLayoutEffect(() => {
    if (menu?.open && !wasOpen.current) menu.focusInitial();
    wasOpen.current = Boolean(menu?.open);
  });

  let surfaceStyle = placementSurfaceStyle(placement, offset, menu?.triggerId, style);
  if (ownContextMenu) {
    // Positioning stays consumer CSS, for example:
    // position: fixed; left: var(--comp0-context-menu-x); top: var(--comp0-context-menu-y)
    surfaceStyle = {
      "--comp0-context-menu-x": `${contextMenu.position.x}px`,
      "--comp0-context-menu-y": `${contextMenu.position.y}px`,
      ...surfaceStyle,
    } as CSSProperties;
  }

  return (
    <div
      {...props}
      ref={composeRefs(surfaceRef, ref, menu?.setSurfaceElement)}
      popover="auto"
      hidden={!menu?.open}
      style={surfaceStyle}
      data-open={menu?.open || undefined}
      onContextMenu={onContextMenu}
      onContextMenuCapture={(event) => {
        onContextMenuCapture?.(event);
        if (!event.defaultPrevented && ownContextMenu) event.preventDefault();
      }}
      onToggle={(event) => {
        onToggle?.(event);
        // Toggle events from nested popovers bubble in the React tree;
        // only this surface's own toggles drive its state.
        if (event.target !== event.currentTarget) return;
        if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
      }}
      onBlur={(event) => {
        onBlur?.(event);
        // The menu follows focus: a submenu closes when focus moves to a
        // different parent item, and any menu closes when focus tabs out
        // of the surface and its trigger entirely.
        if (!menu?.open) return;
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
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        const targetSurface =
          event.target instanceof Element ? event.target.closest("[popover]") : null;
        if (targetSurface !== event.currentTarget) return;
        event.preventDefault();
        menu?.setOpen(false);
        menu?.focusTrigger();
      }}
    >
      {children}
    </div>
  );
}
