import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { useRequiredDialogContext } from "../internal/overlay/context.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type DialogTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function DialogTrigger({ as, onClick, ref, ...props }: DialogTriggerProps) {
  const dialog = useRequiredDialogContext("DialogTrigger");
  const triggerRef = useComposedRefs(ref, dialog.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? dialog.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-controls={props["aria-controls"] ?? dialog.contentId}
      aria-expanded={dialog.open}
      aria-haspopup={props["aria-haspopup"] ?? "dialog"}
      data-open={dataAttr(dialog.open)}
      data-slot={dataSlot(props, "dialog-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) dialog.setOpen(!dialog.open);
      }}
    />
  );
}
