import { type ComponentProps, type CSSProperties } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselViewportProps = ComponentProps<"div"> & AsProp;

/**
 * Wraps the slides and exposes the active index as the
 * --comp0-carousel-index variable for transform-based slide tracks. While
 * auto-rotation runs the viewport stays aria-live="off"; once rotation is
 * paused or stopped it flips to "polite" so slide changes are announced (APG).
 */
export function CarouselViewport({ as, style, children, ...props }: CarouselViewportProps) {
  const carousel = useCarouselContext("CarouselViewport");
  // Inside the collection pass only the slides matter, so the viewport renders no element.
  const collecting = useIsCollectionPass();
  if (collecting) return children;
  let live: "off" | "polite" = "polite";
  if (carousel.rotating) live = "off";

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      aria-live={live}
      style={{ ...style, "--comp0-carousel-index": `${carousel.value}` } as CSSProperties}
    >
      {children}
    </Part>
  );
}
