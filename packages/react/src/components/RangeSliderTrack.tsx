import { useContext } from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { RangeSliderContext, valueAtPointer, type RangeSliderTrackProps } from "./range-shared.js";
export type { RangeSliderTrackProps } from "./range-shared.js";

/**
 * The rail the thumbs travel along. Pressing the track moves the nearest
 * thumb to the pointer and focuses it; thumbs handle their own drags.
 */
export function RangeSliderTrack({
  onPointerDown,
  ref,
  ...props
}: RangeSliderTrackProps & RefProp<HTMLDivElement>) {
  const context = useContext(RangeSliderContext);
  if (!context) throw new Error("RangeSliderTrack must be rendered inside RangeSlider.");

  return (
    <div
      {...props}
      ref={composeRefs(ref, context.trackRef)}
      data-slot={dataSlot(props, "range-slider-track")}
      data-orientation={context.orientation}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        // A pointer down on a thumb prevents default; the thumb owns that drag.
        if (event.defaultPrevented || context.disabled) return;
        const next = valueAtPointer(
          event,
          event.currentTarget.getBoundingClientRect(),
          context.orientation,
          context.min,
          context.max,
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
