import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useTourContext } from "./tour-shared.js";

export type TourTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function TourTrigger({ as, onClick, ref, ...props }: TourTriggerProps) {
  const tour = useTourContext("TourTrigger");
  const triggerRef = useComposedRefs(ref, tour.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-controls={props["aria-controls"] ?? tour.contentId}
      aria-expanded={tour.open}
      aria-haspopup={props["aria-haspopup"] ?? "dialog"}
      data-open={dataAttr(tour.open)}
      data-slot={dataSlot(props, "tour-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) tour.start();
      }}
    />
  );
}
