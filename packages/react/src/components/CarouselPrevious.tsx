import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselPreviousProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Native button that shows the previous slide. Disabled on the first slide
 * unless the carousel loops. Defaults its aria-label to "Previous slide".
 */
export function CarouselPrevious({
  disabled,
  onClick,
  ref,
  ...props
}: CarouselPreviousProps & RefProp<HTMLButtonElement>) {
  const carousel = useCarouselContext("CarouselPrevious");
  const resolvedDisabled = Boolean(disabled ?? (!carousel.loop && carousel.index <= 0));

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      aria-label={props["aria-label"] ?? "Previous slide"}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.previous();
      }}
    />
  );
}
