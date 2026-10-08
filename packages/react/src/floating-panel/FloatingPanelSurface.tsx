import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";
import { placementSurfaceStyle, type PopoverPlacement } from "../internal/overlay/placement.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type FloatingPanelSurfaceProps = ComponentProps<"div"> &
  AsProp & {
    offset?: number | undefined;
    placement?: PopoverPlacement | undefined;
    portal?: boolean | undefined;
  };

export function FloatingPanelSurface({
  as,
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
}: FloatingPanelSurfaceProps) {
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

  const bounded = Boolean(panel.boundary);
  let surfaceStyle = placementSurfaceStyle(placement, offset, panel.triggerId, style);
  if (panel.position) {
    if (bounded) {
      surfaceStyle = {
        ...style,
        position: "absolute",
        inset: "0 auto auto 0",
        margin: 0,
        translate: `${panel.position.x}px ${panel.position.y}px`,
      };
    } else {
      surfaceStyle = {
        ...style,
        position: "fixed",
        inset: "auto",
        margin: 0,
        left: panel.position.x,
        top: panel.position.y,
      };
    }
  } else {
    surfaceStyle = { position: bounded ? "absolute" : "fixed", ...surfaceStyle };
  }
  if (panel.size) {
    surfaceStyle = { ...surfaceStyle, width: panel.size.width, height: panel.size.height };
  }
  surfaceStyle = { ...surfaceStyle, zIndex: style?.zIndex ?? 1000 + Math.max(panel.stackIndex, 0) };

  const Part = partElement(as, "div");
  const surface = (
    <Part
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
      onFocusCapture={(event: FocusEvent<HTMLDivElement>) => {
        onFocusCapture?.(event);
        if (!event.defaultPrevented) panel.activate(event.target as HTMLElement);
      }}
      onPointerDownCapture={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDownCapture?.(event);
        if (!event.defaultPrevented) panel.activate(event.target as HTMLElement);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Escape") return;
        event.preventDefault();
        panel.requestClose();
      }}
    >
      <>
        {children}
        <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
          {panel.announcement}
        </output>
      </>
    </Part>
  );

  if (!portal || bounded || typeof document === "undefined") return surface;
  return createPortal(surface, document.body);
}
