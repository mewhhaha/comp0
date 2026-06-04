import { useContext } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselViewportProps } from "./carousel-shared.js";
export type { CarouselViewportProps } from "./carousel-shared.js";

export function CarouselViewport({
  ref,
  ...props
}: CarouselViewportProps & RefProp<HTMLDivElement>) {
  const carousel = useContext(CarouselContext);

  return (
    <div
      {...props}
      ref={ref}
      aria-live={carousel?.rotating ? "off" : "polite"}
      data-slot={dataSlot(props, "carousel-viewport")}
    />
  );
}
