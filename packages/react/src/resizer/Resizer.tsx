import {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { TableColumnContext } from "../table/table-shared.js";

const RESIZE_STEP = 16;

export type ResizerProps = Omit<ComponentProps<"span">, "onResize"> &
  AsProp & {
    /** A vertical separator resizes width; a horizontal one resizes height. */
    orientation?: "vertical" | "horizontal" | undefined;
    /** Receives the next size; inside a resizable TableColumn this is optional. */
    onResize?: ((size: number) => void) | undefined;
    /** The element to measure; defaults to the table column or the parent element. */
    target?: RefObject<HTMLElement | null> | undefined;
    min?: number | undefined;
    max?: number | undefined;
    /** The current size, exposed as aria-valuenow for the separator. */
    size?: number | undefined;
  };

/**
 * An APG window splitter: a separator that resizes its neighbor with drag,
 * arrows, Home, and End. Standalone it is its own tab stop; inside a
 * resizable TableColumn the grid's ArrowLeft/ArrowRight reach it instead,
 * plain arrows keep navigating, and Shift+Arrow resizes via the header.
 */
export function Resizer({
  as,
  orientation = "vertical",
  onResize,
  target,
  min = 0,
  max,
  size,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ref,
  ...props
}: ResizerProps) {
  const column = useContext(TableColumnContext);
  const selfRef = useRef<HTMLElement | null>(null);
  const composedRef = useComposedRefs(selfRef, ref);
  const drag = useRef<{ pointerId: number; start: number; startSize: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = (next: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, next));
  const emit = (next: number) => {
    const clamped = clamp(next);
    if (onResize) onResize(clamped);
    else column?.resize(clamped);
  };
  const measure = () => {
    const element = target?.current ?? column?.element() ?? selfRef.current?.parentElement;
    if (!element) return undefined;
    return orientation === "vertical" ? element.offsetWidth : element.offsetHeight;
  };
  const inColumn = column !== null && !target;
  // A focusable separator must expose aria-valuenow; measure the target when
  // the consumer does not track the size themselves.
  const [measured, setMeasured] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    if (size !== undefined) return;
    const element = target?.current ?? column?.element() ?? selfRef.current?.parentElement;
    if (!element) return;
    const update = () => {
      setMeasured(orientation === "vertical" ? element.offsetWidth : element.offsetHeight);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [column, orientation, size, target]);

  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      ref={composedRef}
      role="separator"
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={size ?? measured}
      tabIndex={props.tabIndex ?? (inColumn ? -1 : 0)}
      data-dragging={dataAttr(dragging)}
      data-slot={dataSlot(props, "resizer")}
      style={{
        touchAction: "none",
        cursor: orientation === "vertical" ? "col-resize" : "row-resize",
        ...props.style,
      }}
      onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (inColumn && !event.shiftKey) return;
        const forward = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
        const backward = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
        if (event.key === forward || event.key === backward) {
          const current = size ?? measure();
          if (current === undefined) return;
          event.preventDefault();
          emit(current + (event.key === forward ? RESIZE_STEP : -RESIZE_STEP));
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          emit(min);
        }
        if (event.key === "End" && max !== undefined) {
          event.preventDefault();
          emit(max);
        }
      }}
      onPointerDown={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerDown?.(event);
        if (event.defaultPrevented) return;
        const startSize = size ?? measure();
        if (startSize === undefined) return;
        event.preventDefault();
        drag.current = {
          pointerId: event.pointerId,
          start: orientation === "vertical" ? event.clientX : event.clientY,
          startSize,
        };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerMove?.(event);
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId) return;
        const position = orientation === "vertical" ? event.clientX : event.clientY;
        emit(state.startSize + position - state.start);
      }}
      onPointerUp={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerUp?.(event);
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event: PointerEvent<HTMLSpanElement>) => {
        onPointerCancel?.(event);
        drag.current = null;
        setDragging(false);
      }}
    />
  );
}
