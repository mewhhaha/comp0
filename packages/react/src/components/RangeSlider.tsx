import { useRef, type CSSProperties } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  RangeSliderContext,
  snapToStep,
  type RangeSliderProps,
  type RangeSliderThumbKind,
  type RangeSliderValue,
} from "./range-shared.js";
export type { RangeSliderProps, RangeSliderValue } from "./range-shared.js";

/**
 * An APG multi-thumb slider with a start and an end thumb. The root is a
 * group and needs an accessible name: pass aria-label (or aria-labelledby),
 * and give each RangeSliderThumb its own aria-label. With a name, the pair
 * submits as two hidden inputs, `${name}-start` and `${name}-end`. The root
 * exposes the thumb positions as 0..1 fractions in the
 * --comp0-range-slider-start and --comp0-range-slider-end custom properties.
 */
export function RangeSlider({
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  orientation = "horizontal",
  name,
  style,
  children,
  ref,
  ...props
}: RangeSliderProps & RefProp<HTMLDivElement>) {
  const [range, setRange] = useControllableState<RangeSliderValue>({
    value,
    defaultValue: defaultValue ?? [min, max],
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Record<RangeSliderThumbKind, HTMLElement | null>>({
    start: null,
    end: null,
  });
  const [start, end] = range;
  const span = max - min;
  const fraction = (thumbValue: number) => (span === 0 ? 0 : (thumbValue - min) / span);

  const setThumbValue = (thumb: RangeSliderThumbKind, next: number) => {
    if (resolvedDisabled) return;
    setRange((current) => {
      const [currentStart, currentEnd] = current;
      const snapped = snapToStep(next, min, max, step);
      let nextStart = currentStart;
      let nextEnd = currentEnd;
      // Thumbs clamp at each other so the range can collapse but never cross.
      if (thumb === "start") nextStart = Math.min(snapped, currentEnd);
      else nextEnd = Math.max(snapped, currentStart);
      if (nextStart === currentStart && nextEnd === currentEnd) return current;
      return [nextStart, nextEnd];
    });
  };

  return (
    <RangeSliderContext
      value={{
        value: range,
        min,
        max,
        step,
        disabled: resolvedDisabled,
        orientation,
        trackRef,
        thumbRefs,
        setThumbValue,
      }}
    >
      <div
        {...props}
        ref={ref}
        role="group"
        data-orientation={orientation}
        data-disabled={dataAttr(resolvedDisabled)}
        style={
          {
            ...style,
            "--comp0-range-slider-start": `${fraction(start)}`,
            "--comp0-range-slider-end": `${fraction(end)}`,
          } as CSSProperties
        }
      >
        {children}
        {name && (
          <>
            <input type="hidden" name={`${name}-start`} value={start} disabled={resolvedDisabled} />
            <input type="hidden" name={`${name}-end`} value={end} disabled={resolvedDisabled} />
          </>
        )}
      </div>
    </RangeSliderContext>
  );
}
