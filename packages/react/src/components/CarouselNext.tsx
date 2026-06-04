import { useContext } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselControlProps } from "./carousel-shared.js";
export type { CarouselControlProps as CarouselNextProps } from "./carousel-shared.js";

export function CarouselNext({
  onClick,
  ref,
  ...props
}: CarouselControlProps & RefProp<HTMLButtonElement>) {
  const carousel = useContext(CarouselContext);

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      data-slot={dataSlot(props, "carousel-next")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel?.next();
      }}
    />
  );
}
