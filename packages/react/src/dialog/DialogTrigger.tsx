import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { useRequiredDialogContext } from "../internal/overlay/context.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type DialogTriggerProps = ComponentProps<"button"> & AsProp;

export function DialogTrigger({ as, ref, ...props }: DialogTriggerProps) {
  const dialog = useRequiredDialogContext("DialogTrigger");
  const triggerRef = useComposedRefs(ref, dialog.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: dialog.open,
    onOpenChange: dialog.setOpen,
    id: dialog.triggerId,
    controls: dialog.contentId,
    haspopup: "dialog",
    props,
  });

  const Part = partElement(as, "button");
  return <Part data-slot="dialog-trigger" {...props} ref={triggerRef} {...trigger} />;
}
