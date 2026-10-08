import { useId, useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext } from "./carousel-shared.js";

export type CarouselSlideProps = ComponentProps<"div"> & AsProp;

/**
 * One slide of the carousel. Slides register themselves in document order, so
 * each is announced as "N of M" by default; pass aria-label to name a slide
 * after its content instead. The active slide carries data-current.
 */
export function CarouselSlide({ as, ref, ...props }: CarouselSlideProps) {
  const carousel = useCarouselContext("CarouselSlide");
  const key = useId();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { collection } = carousel;

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({ key, textValue: "", element });
    return () => {
      collection.unregister(key, element);
    };
  }, [collection, element, key]);

  const position = carousel.order.indexOf(key);
  let label = props["aria-label"];
  if (label === undefined && position >= 0) label = `${position + 1} of ${carousel.count}`;
  const current = position >= 0 && position === carousel.value;

  const Part = partElement(as, "div");
  return (
    <Part
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
