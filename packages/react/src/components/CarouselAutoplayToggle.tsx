import { type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselAutoplayToggleProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Native button that stops and restarts auto-rotation; stopping here stays
 * stopped until pressed again, unlike the temporary hover and focus pauses
 * (WCAG 2.2.2). Its aria-label follows the state — "Pause carousel" while
 * rotation is on, "Play carousel" once stopped — so it renders nothing when
 * the carousel has no autoplay. Place it first inside the carousel so
 * keyboard users reach it before the slides (APG).
 */
export function CarouselAutoplayToggle({
  onClick,
  ref,
  ...props
}: CarouselAutoplayToggleProps & RefProp<HTMLButtonElement>) {
  const carousel = useCarouselContext("CarouselAutoplayToggle");
  if (carousel.autoplay === undefined) return null;
  let label = props["aria-label"];
  if (label === undefined) label = carousel.stopped ? "Play carousel" : "Pause carousel";

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      aria-label={label}
      data-stopped={dataAttr(carousel.stopped)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel.toggleStopped();
      }}
    />
  );
}
