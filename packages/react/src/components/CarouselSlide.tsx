import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselSlideProps } from "./carousel-shared.js";
export type { CarouselSlideProps } from "./carousel-shared.js";

export function CarouselSlide({ id, ref, ...props }: CarouselSlideProps & RefProp<HTMLDivElement>) {
  const carousel = useContext(CarouselContext);
  const registerSlide = carousel?.registerSlide;
  const selected = carousel?.selectedKey === id;
  const slides = carousel?.slides() ?? [];
  const index = Math.max(
    0,
    slides.findIndex((slide) => slide.key === id),
  );

  const slideRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerSlide?.(id, element);
      composeRefs(ref)(element);
    },
    [id, ref, registerSlide],
  );

  return (
    <div
      {...props}
      ref={slideRef}
      id={id}
      role="group"
      aria-roledescription={props["aria-roledescription"] ?? "slide"}
      aria-label={
        props["aria-label"] ?? (slides.length ? `${index + 1} of ${slides.length}` : undefined)
      }
      hidden={!selected}
      data-selected={dataAttr(selected)}
      data-slot={dataSlot(props, "carousel-slide")}
    />
  );
}
