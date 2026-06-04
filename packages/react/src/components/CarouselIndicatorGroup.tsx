import { useContext } from "react";
import { getRovingFocusTarget } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselIndicatorGroupProps } from "./carousel-shared.js";
export type { CarouselIndicatorGroupProps } from "./carousel-shared.js";

export function CarouselIndicatorGroup({
  orientation = "horizontal",
  onKeyDown,
  ref,
  ...props
}: CarouselIndicatorGroupProps & RefProp<HTMLDivElement>) {
  const carousel = useContext(CarouselContext);

  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-slot={dataSlot(props, "carousel-indicator-group")}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !carousel) return;
        const key = getRovingFocusTarget(carousel.slides(), carousel.selectedKey, event.key, {
          orientation,
          loop: true,
        });
        if (!key) return;
        event.preventDefault();
        carousel.select(key);
        document.getElementById(`${key}-indicator`)?.focus();
      }}
    />
  );
}
