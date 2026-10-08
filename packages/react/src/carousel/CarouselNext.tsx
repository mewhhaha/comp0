import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselNextProps = ComponentProps<"button"> & AsProp;

/**
 * Native button that shows the next slide. Disabled on the last slide unless
 * the carousel loops. Defaults its aria-label to "Next slide".
 */
export function CarouselNext({ as, disabled, onClick, ...props }: CarouselNextProps) {
  const carousel = useCarouselContext("CarouselNext");
  const atEnd = carousel.count > 0 && carousel.value >= carousel.count - 1;
  const resolvedDisabled = Boolean(disabled ?? (!carousel.loop && atEnd));

  const Part = partElement(as, "button");
  return (
    <Part
      type={as === undefined || as === "button" ? "button" : undefined}
      {...props}
      aria-label={props["aria-label"] ?? "Next slide"}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.next();
      }}
    />
  );
}
