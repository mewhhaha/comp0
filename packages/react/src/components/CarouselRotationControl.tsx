import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselControlProps } from "./carousel-shared.js";
export type { CarouselControlProps as CarouselRotationControlProps } from "./carousel-shared.js";

export function CarouselRotationControl({
  onClick,
  ref,
  ...props
}: CarouselControlProps & RefProp<HTMLButtonElement>) {
  const carousel = useContext(CarouselContext);
  const rotating = carousel?.rotating ?? false;

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      aria-pressed={rotating}
      data-rotating={dataAttr(rotating)}
      data-slot={dataSlot(props, "carousel-rotation-control")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel?.setRotating(!rotating);
      }}
    />
  );
}
