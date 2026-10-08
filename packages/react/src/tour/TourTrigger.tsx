import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useTourContext } from "./tour-shared.js";

export type TourTriggerProps = ComponentProps<"button"> & AsProp;

export function TourTrigger({ as, ref, ...props }: TourTriggerProps) {
  const tour = useTourContext("TourTrigger");
  const triggerRef = useComposedRefs(ref, tour.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: tour.open,
    // A tour has no toggle: the trigger only starts it, and the content closes it.
    onOpenChange: () => tour.start(),
    controls: tour.contentId,
    haspopup: "dialog",
    props,
  });

  const Part = partElement(as, "button");
  return <Part data-slot="tour-trigger" {...props} ref={triggerRef} {...trigger} />;
}
