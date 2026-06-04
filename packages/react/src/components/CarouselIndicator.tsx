import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";
import { type CarouselIndicatorProps } from "./carousel-shared.js";
export type { CarouselIndicatorProps } from "./carousel-shared.js";

export function CarouselIndicator({
  id,
  onClick,
  ref,
  ...props
}: CarouselIndicatorProps & RefProp<HTMLButtonElement>) {
  const carousel = useContext(CarouselContext);
  const selected = carousel?.selectedKey === id;

  return (
    <button
      {...props}
      ref={ref}
      id={`${id}-indicator`}
      type={props.type ?? "button"}
      role="tab"
      tabIndex={selected ? 0 : -1}
      aria-selected={selected}
      aria-controls={id}
      data-selected={dataAttr(selected)}
      data-slot={dataSlot(props, "carousel-indicator")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) carousel?.select(id);
      }}
    />
  );
}
