import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useDrawerContext, type DrawerSide } from "./drawer-shared.js";
import type { DialogContentProps } from "./overlay-shared.js";

export type DrawerContentProps = DialogContentProps;

const FLICK_VELOCITY = 0.5; // px per ms

type DrawerDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  /** Panel size along the dismiss axis, measured when the drag activates. */
  size: number;
  lastDistance: number;
  lastTime: number;
  velocity: number;
};

function towardEdgeDistance(side: DrawerSide, deltaX: number, deltaY: number) {
  if (side === "left") return -deltaX;
  if (side === "right") return deltaX;
  if (side === "top") return -deltaY;
  return deltaY;
}

function towardEdgeTranslate(side: DrawerSide, distance: number) {
  if (side === "left") return `${-distance}px 0`;
  if (side === "right") return `${distance}px 0`;
  if (side === "top") return `0 ${-distance}px`;
  return `0 ${distance}px`;
}

/** A swipe toward the anchored edge scrolls content the opposite way, so an ancestor with scroll room in that direction owns the gesture. */
function canScrollTowardEdge(element: Element, side: DrawerSide) {
  if (side === "top") return element.scrollHeight - element.scrollTop - element.clientHeight > 0;
  if (side === "bottom") return element.scrollTop > 0;
  if (side === "left") return element.scrollWidth - element.scrollLeft - element.clientWidth > 0;
  return element.scrollLeft > 0;
}

function targetOwnsGesture(target: EventTarget | null, panel: HTMLElement, side: DrawerSide) {
  const ownerWindow = panel.ownerDocument.defaultView;
  if (!ownerWindow || !(target instanceof ownerWindow.Element)) return false;
  if (target.closest("button, a, input, select, textarea, [contenteditable]")) return true;
  for (
    let element: Element | null = target;
    element && element !== panel;
    element = element.parentElement
  ) {
    if (canScrollTowardEdge(element, side)) return true;
  }
  return false;
}

export function DrawerContent({
  onCancel,
  onClose,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  portal = true,
  ref,
  ...props
}: DrawerContentProps & RefProp<HTMLDialogElement>) {
  const drawer = useDrawerContext();
  const side = drawer?.side ?? "right";
  const contentRef = useRef<HTMLDialogElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dismissingRef = useRef(false);
  const wasOpenRef = useRef(false);
  const dragRef = useRef<DrawerDrag | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    if (drawer?.open) {
      if (!wasOpenRef.current) {
        const activeElement = element.ownerDocument.activeElement;
        const ownerWindow = element.ownerDocument.defaultView;
        restoreFocusRef.current =
          ownerWindow && activeElement instanceof ownerWindow.HTMLElement ? activeElement : null;
      }
      wasOpenRef.current = true;
      if (!element.open && typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    if (element.open && typeof element.close === "function") element.close();
    else element.removeAttribute("open");
    restoreFocusRef.current?.focus();
  }, [drawer]);

  const content = (
    <dialog
      {...props}
      ref={composeRefs(contentRef, ref)}
      id={props.id ?? drawer?.contentId}
      role={props.role ?? "dialog"}
      aria-modal={props["aria-modal"] ?? true}
      aria-labelledby={props["aria-labelledby"]}
      data-dragging={dataAttr(dragging)}
      data-open={dataAttr(drawer?.open)}
      data-side={side}
      data-slot={dataSlot(props, "drawer-content")}
      onCancel={(event) => {
        onCancel?.(event);
        if (event.defaultPrevented) return;
        // Keep the native element synchronized with controlled state. The state owner decides
        // whether the request is accepted; a rejected request must leave the drawer open.
        event.preventDefault();
        dismissingRef.current = true;
        drawer?.setOpen(false);
        queueMicrotask(() => {
          dismissingRef.current = false;
        });
      }}
      onClose={(event) => {
        onClose?.(event);
        if (drawer?.open && !dismissingRef.current) drawer.setOpen(false);
        restoreFocusRef.current?.focus();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented) return;
        if (targetOwnsGesture(event.target, event.currentTarget, side)) return;
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          active: false,
          size: 0,
          lastDistance: 0,
          lastTime: event.timeStamp,
          velocity: 0,
        };
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        const horizontal = side === "left" || side === "right";
        const distance = towardEdgeDistance(side, deltaX, deltaY);
        if (!drag.active) {
          if (deltaX === 0 && deltaY === 0) return;
          const cross = horizontal ? deltaY : deltaX;
          if (distance <= 0 || Math.abs(cross) > distance) {
            dragRef.current = null;
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          drag.active = true;
          drag.size = horizontal ? rect.width : rect.height;
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const clamped = Math.min(Math.max(distance, 0), drag.size);
        if (event.timeStamp > drag.lastTime) {
          drag.velocity = (clamped - drag.lastDistance) / (event.timeStamp - drag.lastTime);
        }
        drag.lastDistance = clamped;
        drag.lastTime = event.timeStamp;
        event.currentTarget.style.translate = towardEdgeTranslate(side, clamped);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (!drag.active) return;
        const panel = event.currentTarget;
        setDragging(false);
        panel.style.translate = "";
        if (panel.hasPointerCapture(event.pointerId)) panel.releasePointerCapture(event.pointerId);
        // Closing through shared state keeps the native close event and focus restore intact.
        if (drag.lastDistance > drag.size / 2 || drag.velocity > FLICK_VELOCITY) {
          drawer?.setOpen(false);
        }
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (!drag.active) return;
        setDragging(false);
        event.currentTarget.style.translate = "";
      }}
    />
  );

  if (!portal || typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
