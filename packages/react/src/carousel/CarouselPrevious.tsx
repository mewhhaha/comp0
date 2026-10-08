import { type ComponentProps, type MouseEvent } from "react";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselPreviousProps = ComponentProps<"button"> & AsProp;

/**
 * Native button that shows the previous slide. Disabled on the first slide
 * unless the carousel loops. Defaults its aria-label to "Previous slide".
 */
export function CarouselPrevious({ as, disabled, onClick, ...props }: CarouselPreviousProps) {
  const carousel = useCarouselContext("CarouselPrevious");
  const resolvedDisabled = Boolean(disabled ?? (!carousel.loop && carousel.value <= 0));

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
