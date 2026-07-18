import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";
import { placementSurfaceStyle, type PopoverPlacement } from "./overlay-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

/* oxlint-disable jsx-a11y/no-static-element-interactions -- The div receives dialog semantics at runtime and coordinates focus plus activation for a non-modal panel. */

export type FloatingPanelSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  offset?: number | undefined;
  placement?: PopoverPlacement | undefined;
  portal?: boolean | undefined;
};

export function FloatingPanelSurface({
  children,
  hidden,
  offset = 8,
  placement = "bottom start",
  portal = true,
  onFocusCapture,
  onKeyDown,
  onPointerDownCapture,
  ref,
  style,
  ...props
}: FloatingPanelSurfaceProps & RefProp<HTMLDivElement>) {
  const panel = useFloatingPanelContext("FloatingPanelSurface");
  const wasOpen = useRef(false);
  const composedRef = useComposedRefs(panel.setSurfaceElement, ref);

  useLayoutEffect(() => {
    const surface = panel.surfaceRef.current;
    if (!panel.open || wasOpen.current || !surface) {
      wasOpen.current = panel.open;
      return;
    }
    if (!surface.contains(surface.ownerDocument.activeElement)) {
      const target = surface.querySelector<HTMLElement>("[autofocus]") ?? surface;
      target.focus();
    }
    panel.activate(surface.ownerDocument.activeElement as HTMLElement | null);
    wasOpen.current = true;
  });

  let surfaceStyle = placementSurfaceStyle(placement, offset, panel.triggerId, style);
  if (panel.position) {
    surfaceStyle = {
      ...style,
      position: "fixed",
      inset: "auto",
      margin: 0,
      left: panel.position.x,
      top: panel.position.y,
    };
  } else {
    surfaceStyle = { position: "fixed", ...surfaceStyle };
  }
  if (panel.size) {
    surfaceStyle = { ...surfaceStyle, width: panel.size.width, height: panel.size.height };
  }
  surfaceStyle = { ...surfaceStyle, zIndex: style?.zIndex ?? 1000 + Math.max(panel.stackIndex, 0) };

  const surface = (
    <div
      {...props}
      ref={composedRef}
      id={props.id ?? panel.contentId}
      role={props.role ?? "dialog"}
      tabIndex={props.tabIndex ?? 0}
      aria-labelledby={
        props["aria-label"] ? props["aria-labelledby"] : (props["aria-labelledby"] ?? panel.titleId)
      }
      hidden={hidden ?? !panel.open}
      data-active={dataAttr(panel.active)}
      data-moving={dataAttr(panel.moving)}
      data-open={dataAttr(panel.open)}
      data-resizing={dataAttr(panel.resizing)}
      data-slot={dataSlot(props, "floating-panel-surface")}
      style={surfaceStyle}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented) panel.activate(event.target as HTMLElement);
      }}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event);
        if (!event.defaultPrevented) panel.activate(event.target as HTMLElement);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        panel.requestClose();
      }}
    >
      {children}
      <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        {panel.announcement}
      </output>
    </div>
  );

  if (!portal || typeof document === "undefined") return surface;
  return createPortal(surface, document.body);
}
