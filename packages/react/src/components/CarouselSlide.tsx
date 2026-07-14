import { useLayoutEffect, useState, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselSlideProps = HTMLAttributes<HTMLDivElement>;

/**
 * One slide of the carousel. Slides register themselves in document order, so
 * each is announced as "N of M" by default; pass aria-label to name a slide
 * after its content instead. The active slide carries data-current.
 */
export function CarouselSlide({ ref, ...props }: CarouselSlideProps & RefProp<HTMLDivElement>) {
  const carousel = useCarouselContext("CarouselSlide");
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const { registerSlide } = carousel;

  useLayoutEffect(() => {
    if (!element) return;
    return registerSlide(element);
  }, [element, registerSlide]);

  const position = element ? carousel.slides.indexOf(element) : -1;
  let label = props["aria-label"];
  if (label === undefined && position >= 0) label = `${position + 1} of ${carousel.count}`;
  const current = position >= 0 && position === carousel.index;

  return (
    <div
      {...props}
      ref={composeRefs(ref, setElement)}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!current || undefined}
      inert={!current}
      data-current={dataAttr(current)}
    />
  );
}
