import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselNextProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Native button that shows the next slide. Disabled on the last slide unless
 * the carousel loops. Defaults its aria-label to "Next slide".
 */
export function CarouselNext({
  disabled,
  onClick,
  ref,
  ...props
}: CarouselNextProps & RefProp<HTMLButtonElement>) {
  const carousel = useCarouselContext("CarouselNext");
  const atEnd = carousel.count > 0 && carousel.index >= carousel.count - 1;
  const resolvedDisabled = Boolean(disabled ?? (!carousel.loop && atEnd));

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      aria-label={props["aria-label"] ?? "Next slide"}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.next();
      }}
    />
  );
}
