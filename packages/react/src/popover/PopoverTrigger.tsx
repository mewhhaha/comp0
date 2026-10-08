import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { triggerAnchorStyle, useRequiredPopoverContext } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type PopoverTriggerProps = ComponentProps<"button"> & AsProp;

export function PopoverTrigger({ as, ref, style, ...props }: PopoverTriggerProps) {
  const popover = useRequiredPopoverContext("PopoverTrigger");
  const triggerRef = useComposedRefs(ref, popover.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: popover.open,
    onOpenChange: popover.setOpen,
    id: popover.triggerId,
    controls: popover.contentId,
    haspopup: "dialog",
    props,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="popover-trigger"
      {...props}
      ref={triggerRef}
      style={triggerAnchorStyle(popover.triggerId, style)}
      {...trigger}
    />
  );
}
