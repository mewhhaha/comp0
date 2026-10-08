import { useRef, type ComponentProps, type CSSProperties } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useFormReset } from "../internal/form-control-state.js";
import { FormValue } from "../internal/form-value.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { snapToStep } from "../internal/range-shared.js";
import {
  RangeSliderContext,
  type RangeSliderThumbKind,
  type RangeSliderValue,
} from "./range-slider-shared.js";
export type { RangeSliderValue } from "./range-slider-shared.js";

export type RangeSliderProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    value?: RangeSliderValue | undefined;
    defaultValue?: RangeSliderValue | undefined;
    /** Receives the next [start, end] pair; shadows the DOM onChange. */
    onChange?: ((value: RangeSliderValue) => void) | undefined;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    disabled?: boolean | undefined;
    orientation?: "horizontal" | "vertical" | undefined;
    /** Submits two hidden inputs named `${name}-start` and `${name}-end`. */
    name?: string | undefined;
    /** Associates the hidden form controls with a form by id. */
    form?: string | undefined;
  };

/**
 * An APG multi-thumb slider with a start and an end thumb. The root is a
 * group and needs an accessible name: pass aria-label (or aria-labelledby),
 * and give each RangeSliderThumb its own aria-label. With a name, the pair
 * submits as two hidden inputs, `${name}-start` and `${name}-end`. The root
 * exposes the thumb positions as 0..1 fractions in the
 * --comp0-range-slider-start and --comp0-range-slider-end custom properties.
 */
export function RangeSlider({
  as,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  orientation = "horizontal",
  name,
  form,
  style,
  children,
  ...props
}: RangeSliderProps) {
  const [range, setRange, rangeState] = useControllableState<RangeSliderValue>({
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
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
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
  useFormReset({
    controlRef: startInputRef,
    form,
    state: rangeState,
    readValue: (element): RangeSliderValue => [
      Number(element.value),
      Number(endInputRef.current?.value ?? end),
    ],
  });

  const Part = partElement(as, "div");
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
        registerThumb(thumb, element) {
          thumbRefs.current[thumb] = element;
        },
        focusThumb(thumb) {
          thumbRefs.current[thumb]?.focus();
        },
        setThumbValue,
      }}
    >
      <Part
        {...props}
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
        <>
          {children}
          <FormValue
            ref={startInputRef}
            name={name && `${name}-start`}
            value={String(start)}
            form={form}
            disabled={resolvedDisabled}
          />
          <FormValue
            ref={endInputRef}
            name={name && `${name}-end`}
            value={String(end)}
            form={form}
            disabled={resolvedDisabled}
          />
        </>
      </Part>
    </RangeSliderContext>
  );
}
