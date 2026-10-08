import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelTriggerProps = ComponentProps<"button"> & AsProp;

export function FloatingPanelTrigger({ as, ref, style, ...props }: FloatingPanelTriggerProps) {
  const panel = useFloatingPanelContext("FloatingPanelTrigger");
  const triggerRef = useComposedRefs(ref, panel.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: panel.open,
    onOpenChange(next) {
      panel.setOpen(next);
      if (next) panel.activate();
    },
    id: panel.triggerId,
    controls: panel.contentId,
    haspopup: "dialog",
    props,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="floating-panel-trigger"
      {...props}
      ref={triggerRef}
      style={triggerAnchorStyle(panel.triggerId, style)}
      {...trigger}
    />
  );
}
