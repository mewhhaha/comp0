import { useContext, useRef, useState } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { RangeSliderContext, valueAtPointer, type RangeSliderThumbProps } from "./range-shared.js";
export type { RangeSliderThumbProps } from "./range-shared.js";

/**
 * One end of the range: a focusable role="slider" div that needs its own
 * aria-label (for example "Minimum price"). Its announced bounds interlock
 * with the sibling thumb: the end thumb's minimum is the start value and the
 * start thumb's maximum is the end value. Arrows move by step (Right/Up
 * increase), PageUp/PageDown by ten steps, and Home/End jump to this thumb's
 * own bounds. Dragging sets data-dragging while the pointer is captured.
 */
export function RangeSliderThumb({
  thumb,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ref,
  ...props
}: RangeSliderThumbProps & RefProp<HTMLDivElement>) {
  const context = useContext(RangeSliderContext);
  const drag = useRef<{ pointerId: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  if (!context) throw new Error("RangeSliderThumb must be rendered inside RangeSlider.");
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

  return (
    <div
      {...props}
      ref={composeRefs(ref, (element) => {
        context.thumbRefs.current[thumb] = element;
      })}
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
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        let next: number | undefined;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") next = ownValue + step;
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = ownValue - step;
        if (event.key === "PageUp") next = ownValue + step * 10;
        if (event.key === "PageDown") next = ownValue - step * 10;
        if (event.key === "Home") next = ownMin;
        if (event.key === "End") next = ownMax;
        if (next === undefined) return;
        event.preventDefault();
        setThumbValue(thumb, next);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled) return;
        event.preventDefault();
        drag.current = { pointerId: event.pointerId };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId) return;
        const rect = trackRect(event.currentTarget);
        if (!rect) return;
        const next = valueAtPointer(event, rect, orientation, min, max);
        if (next !== undefined) setThumbValue(thumb, next);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        drag.current = null;
        setDragging(false);
      }}
    />
  );
}
