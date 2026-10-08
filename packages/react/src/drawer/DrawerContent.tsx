import { useRef, useState, type ComponentProps, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { dataAttr } from "@comp0/core";
import { useModalDialog } from "../internal/overlay/modal-dialog.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useDrawerContext, type DrawerSide } from "./drawer-shared.js";

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

export type DrawerContentProps = Omit<ComponentProps<"dialog">, "open"> &
  AsProp & {
    /** Render into `document.body` instead of in place. */
    portal?: boolean | undefined;
  };

export function DrawerContent({
  as,
  onCancel,
  onClose,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  portal = true,
  ref,
  ...props
}: DrawerContentProps) {
  const drawer = useDrawerContext("DrawerContent");
  const side = drawer.side;
  const modal = useModalDialog({
    open: drawer.open,
    setOpen: drawer.setOpen,
    ref,
    onCancel,
    onClose,
  });
  const dragRef = useRef<DrawerDrag | null>(null);
  const [dragging, setDragging] = useState(false);

  const Part = partElement(as, "dialog");
  const content = (
    <Part
      {...props}
      {...modal}
      id={props.id ?? drawer.contentId}
      role={props.role ?? "dialog"}
      aria-modal={props["aria-modal"] ?? true}
      data-dragging={dataAttr(dragging)}
      data-open={dataAttr(drawer.open)}
      data-side={side}
      data-slot={dataSlot(props, "drawer-content")}
      onPointerDown={(event: PointerEvent<HTMLDialogElement>) => {
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
      onPointerMove={(event: PointerEvent<HTMLDialogElement>) => {
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
      onPointerUp={(event: PointerEvent<HTMLDialogElement>) => {
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
          drawer.setOpen(false);
        }
      }}
      onPointerCancel={(event: PointerEvent<HTMLDialogElement>) => {
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
