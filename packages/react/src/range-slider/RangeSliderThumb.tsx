import {
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { isRtl, valueAtPointer } from "../internal/range-shared.js";
import { dataSlot } from "../internal/shared.js";
import { useRangeSliderContext, type RangeSliderThumbKind } from "./range-slider-shared.js";

export type RangeSliderThumbProps = ComponentProps<"div"> &
  AsProp & {
    /** Which end of the range this thumb controls. */
    thumb: RangeSliderThumbKind;
  };

/**
 * One end of the range: a focusable role="slider" div that needs its own
 * aria-label (for example "Minimum price"). Its announced bounds interlock
 * with the sibling thumb: the end thumb's minimum is the start value and the
 * start thumb's maximum is the end value. Arrows move by step (Right/Up
 * increase), PageUp/PageDown by ten steps, and Home/End jump to this thumb's
 * own bounds. Dragging sets data-dragging while the pointer is captured.
 */
export function RangeSliderThumb({
  as,
  thumb,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ref,
  ...props
}: RangeSliderThumbProps) {
  const context = useRangeSliderContext("RangeSliderThumb");
  const drag = useRef<{ pointerId: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const { value, min, max, step, disabled, orientation, setThumbValue } = context;
  const [start, end] = value;
  const ownValue = thumb === "start" ? start : end;
  // APG interlock: the thumbs share the track but never cross each other.
  const ownMin = thumb === "start" ? min : start;
  const ownMax = thumb === "start" ? end : max;

  const trackRect = (element: HTMLElement) => {
    const track = context.trackRef.current ?? element.parentElement;
    return track?.getBoundingClientRect();
  };

  const composedRef = useComposedRefs(ref, (element: HTMLDivElement | null) => {
    context.registerThumb(thumb, element);
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      role="slider"
      tabIndex={0}
      aria-valuemin={ownMin}
      aria-valuemax={ownMax}
      aria-valuenow={ownValue}
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      data-thumb={thumb}
      data-dragging={dataAttr(dragging)}
      data-disabled={dataAttr(disabled)}
      data-slot={dataSlot(props, "range-slider-thumb")}
      style={{ touchAction: "none", ...props.style }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        // ArrowRight moves toward the visual high end, which in a horizontal
        // right-to-left layout is the low end of the range.
        let increase = step;
        if (orientation === "horizontal" && isRtl(event.currentTarget)) increase = -step;
        let next: number | undefined;
        if (event.key === "ArrowRight") next = ownValue + increase;
        if (event.key === "ArrowLeft") next = ownValue - increase;
        if (event.key === "ArrowUp") next = ownValue + step;
        if (event.key === "ArrowDown") next = ownValue - step;
        if (event.key === "PageUp") next = ownValue + step * 10;
        if (event.key === "PageDown") next = ownValue - step * 10;
        if (event.key === "Home") next = ownMin;
        if (event.key === "End") next = ownMax;
        if (next === undefined) return;
        event.preventDefault();
        setThumbValue(thumb, next);
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled) return;
        event.preventDefault();
        drag.current = { pointerId: event.pointerId };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
      }}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event);
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId) return;
        const rect = trackRect(event.currentTarget);
        if (!rect) return;
        const next = valueAtPointer(
          event,
          rect,
          orientation,
          min,
          max,
          orientation === "horizontal" && isRtl(event.currentTarget),
        );
        if (next !== undefined) setThumbValue(thumb, next);
      }}
      onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
        onPointerUp?.(event);
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event: PointerEvent<HTMLDivElement>) => {
        onPointerCancel?.(event);
        drag.current = null;
        setDragging(false);
      }}
    />
  );
}
