import { type ComponentProps, type PointerEvent } from "react";
import { useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { isRtl, valueAtPointer } from "../internal/range-shared.js";
import { useRangeSliderContext } from "./range-slider-shared.js";

export type RangeSliderTrackProps = ComponentProps<"div"> & AsProp;

/**
 * The rail the thumbs travel along. Pressing the track moves the nearest
 * thumb to the pointer and focuses it; thumbs handle their own drags.
 */
export function RangeSliderTrack({ as, onPointerDown, ref, ...props }: RangeSliderTrackProps) {
  const context = useRangeSliderContext("RangeSliderTrack");

  const composedRef = useComposedRefs(ref, context.trackRef);
  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="range-slider-track"
      {...props}
      ref={composedRef}
      data-orientation={context.orientation}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        // A pointer down on a thumb prevents default; the thumb owns that drag.
        if (event.defaultPrevented || context.disabled) return;
        const next = valueAtPointer(
          event,
          event.currentTarget.getBoundingClientRect(),
          context.orientation,
          context.min,
          context.max,
          context.orientation === "horizontal" && isRtl(event.currentTarget),
        );
        if (next === undefined) return;
        event.preventDefault();
        const [start, end] = context.value;
        let nearest: "start" | "end" = "end";
        if (Math.abs(next - start) < Math.abs(next - end)) nearest = "start";
        context.setThumbValue(nearest, next);
        context.focusThumb(nearest);
      }}
    />
  );
}
