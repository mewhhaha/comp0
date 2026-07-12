import { type CSSProperties, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselViewportProps = HTMLAttributes<HTMLDivElement>;

/**
 * Wraps the slides and exposes the active index as the
 * --comp0-carousel-index variable for transform-based slide tracks. While
 * auto-rotation runs the viewport stays aria-live="off"; once rotation is
 * paused or stopped it flips to "polite" so slide changes are announced (APG).
 */
export function CarouselViewport({
  style,
  ref,
  ...props
}: CarouselViewportProps & RefProp<HTMLDivElement>) {
  const carousel = useCarouselContext("CarouselViewport");
  let live: "off" | "polite" = "polite";
  if (carousel.rotating) live = "off";

  return (
    <div
      {...props}
      ref={ref}
      aria-live={live}
      style={{ ...style, "--comp0-carousel-index": `${carousel.index}` } as CSSProperties}
    />
  );
}
