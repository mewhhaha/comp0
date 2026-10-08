import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useDrawerContext } from "./drawer-shared.js";

export type DrawerTriggerProps = ComponentProps<"button"> & AsProp;

export function DrawerTrigger({ as, ref, ...props }: DrawerTriggerProps) {
  const drawer = useDrawerContext("DrawerTrigger");
  const triggerRef = useComposedRefs(ref, drawer.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: drawer.open,
    onOpenChange: drawer.setOpen,
    id: drawer.triggerId,
    controls: drawer.contentId,
    haspopup: "dialog",
    props,
  });

  const Part = partElement(as, "button");
  return <Part data-slot="drawer-trigger" {...props} ref={triggerRef} {...trigger} />;
}
