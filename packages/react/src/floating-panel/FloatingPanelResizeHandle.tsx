import {
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFloatingPanelContext, type FloatingPanelSize } from "./floating-panel-shared.js";

const RESIZE_STEP = 16;

type PointerResize = {
  pointerId: number;
  startX: number;
  startY: number;
  size: FloatingPanelSize;
};

export type FloatingPanelResizeHandleProps = ComponentProps<"button"> & AsProp;

export function FloatingPanelResizeHandle({
  as,
  disabled,
  onBlur,
  onClick,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: FloatingPanelResizeHandleProps) {
  const panel = useFloatingPanelContext("FloatingPanelResizeHandle");
  const keyboardSize = useRef<FloatingPanelSize | null>(null);
  const pointerResize = useRef<PointerResize | null>(null);

  const currentSize = () => {
    const rect = panel.measure();
    return panel.size ?? (rect ? { width: rect.width, height: rect.height } : undefined);
  };
  const constrain = (size: FloatingPanelSize) => {
    const surface = panel.surfaceRef.current;
    const ownerWindow = surface?.ownerDocument.defaultView;
    if (!surface || !ownerWindow) return size;
    const styles = ownerWindow.getComputedStyle(surface);
    const number = (value: string, fallback: number) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const position = panel.getPosition();
    const boundaryRect = panel.boundary?.current?.getBoundingClientRect();
    const right = boundaryRect?.width ?? ownerWindow.innerWidth;
    const bottom = boundaryRect?.height ?? ownerWindow.innerHeight;
    const availableWidth = Math.max(1, right - (position?.x ?? 0));
    const availableHeight = Math.max(1, bottom - (position?.y ?? 0));
    const minWidth = number(styles.minWidth, 1);
    const minHeight = number(styles.minHeight, 1);
    const maxWidth = Math.min(number(styles.maxWidth, availableWidth), availableWidth);
    const maxHeight = Math.min(number(styles.maxHeight, availableHeight), availableHeight);
    const constrainedMinWidth = Math.min(minWidth, availableWidth);
    const constrainedMinHeight = Math.min(minHeight, availableHeight);
    return {
      width: Math.min(
        Math.max(constrainedMinWidth, size.width),
        Math.max(constrainedMinWidth, maxWidth),
      ),
      height: Math.min(
        Math.max(constrainedMinHeight, size.height),
        Math.max(constrainedMinHeight, maxHeight),
      ),
    };
  };
  const announceSize = (size: FloatingPanelSize) => {
    panel.announce(
      `Panel resized to ${Math.round(size.width)} by ${Math.round(size.height)} pixels.`,
    );
  };
  const beginKeyboardResize = () => {
    const size = currentSize();
    if (!size) return;
    keyboardSize.current = size;
    panel.setResizing(true);
    panel.announce(
      "Resizing panel. Use the arrow keys to make changes, Enter or Space to finish, Escape to cancel.",
    );
  };
  const commitKeyboardResize = () => {
    const size = currentSize();
    keyboardSize.current = null;
    panel.setResizing(false);
    if (size) announceSize(size);
  };
  const cancelKeyboardResize = () => {
    const size = keyboardSize.current;
    if (!size) return;
    keyboardSize.current = null;
    panel.setSize(size);
    panel.setResizing(false);
    panel.announce("Panel resize cancelled.");
  };
  const resizeBy = (width: number, height: number) => {
    const size = currentSize();
    if (!size) return;
    const nextSize = constrain({ width: size.width + width, height: size.height + height });
    panel.setSize(nextSize);
    announceSize(nextSize);
  };

  const isNativeButton = as === undefined || as === "button";
  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="floating-panel-resize-handle"
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      disabled={disabled}
      aria-label={props["aria-label"] ?? "Resize panel"}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-resizing={dataAttr(panel.resizing)}
      style={{ touchAction: "none", ...props.style }}
      onBlur={(event: FocusEvent<HTMLButtonElement>) => {
        onBlur?.(event);
        if (!event.defaultPrevented && keyboardSize.current) cancelKeyboardResize();
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled || event.detail !== 0) return;
        if (keyboardSize.current) commitKeyboardResize();
        else beginKeyboardResize();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (keyboardSize.current) commitKeyboardResize();
          else beginKeyboardResize();
          return;
        }
        if (event.key === "Escape" && keyboardSize.current) {
          event.preventDefault();
          cancelKeyboardResize();
          return;
        }
        if (!keyboardSize.current) return;
        if (event.key === "ArrowLeft") resizeBy(-RESIZE_STEP, 0);
        else if (event.key === "ArrowRight") resizeBy(RESIZE_STEP, 0);
        else if (event.key === "ArrowUp") resizeBy(0, -RESIZE_STEP);
        else if (event.key === "ArrowDown") resizeBy(0, RESIZE_STEP);
        else return;
        event.preventDefault();
      }}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled) return;
        const startingSize = keyboardSize.current;
        if (startingSize) {
          keyboardSize.current = null;
          panel.setSize(startingSize);
          panel.setResizing(false);
        }
        const size = startingSize ?? currentSize();
        if (!size) return;
        event.preventDefault();
        pointerResize.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          size,
        };
        panel.setResizing(true);
        panel.activate(event.currentTarget);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerMove?.(event);
        const resize = pointerResize.current;
        if (event.defaultPrevented || !resize || resize.pointerId !== event.pointerId) return;
        panel.setSize(
          constrain({
            width: resize.size.width + event.clientX - resize.startX,
            height: resize.size.height + event.clientY - resize.startY,
          }),
        );
      }}
      onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerUp?.(event);
        if (event.defaultPrevented || pointerResize.current?.pointerId !== event.pointerId) return;
        pointerResize.current = null;
        panel.setResizing(false);
        const size = currentSize();
        if (size) announceSize(size);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerCancel?.(event);
        const resize = pointerResize.current;
        if (!resize || resize.pointerId !== event.pointerId) return;
        pointerResize.current = null;
        panel.setSize(resize.size);
        panel.setResizing(false);
        panel.announce("Panel resize cancelled.");
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    />
  );
}
