import { type ComponentProps, type MouseEvent } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext, useSlideCount } from "./carousel-shared.js";

export type CarouselPreviousProps = ComponentProps<"button"> & AsProp;

/**
 * Native button that shows the previous slide. Disabled on the first slide
 * unless the carousel loops, and while it has no slides. Defaults its
 * aria-label to "Previous slide".
 */
export function CarouselPrevious({ as, disabled, onClick, ...props }: CarouselPreviousProps) {
  const carousel = useCarouselContext("CarouselPrevious");
  const collecting = useIsCollectionPass();
  const count = useSlideCount(carousel);
  if (collecting) return null;
  const atStart = !carousel.loop && carousel.value <= 0;
  const resolvedDisabled = Boolean(disabled ?? (count === 0 || atStart));

  const disabledAttributes = disabledProps<HTMLButtonElement>(resolvedDisabled, {
    native: true,
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) carousel.previous();
    },
  });

  const Part = partElement(as, "button");
  return (
    <Part
      type={as === undefined || as === "button" ? "button" : undefined}
      {...props}
      aria-label={props["aria-label"] ?? "Previous slide"}
      {...disabledAttributes}
    />
  );
}
