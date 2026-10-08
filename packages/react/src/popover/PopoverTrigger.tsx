import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { triggerAnchorStyle, useRequiredPopoverContext } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type PopoverTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function PopoverTrigger({ as, onClick, ref, style, ...props }: PopoverTriggerProps) {
  const popover = useRequiredPopoverContext("PopoverTrigger");
  const triggerRef = useComposedRefs(ref, popover.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";
  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? popover.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      style={triggerAnchorStyle(popover.triggerId, style)}
      aria-controls={props["aria-controls"] ?? popover.contentId}
      aria-expanded={popover.open}
      aria-haspopup={props["aria-haspopup"] ?? "dialog"}
      data-open={dataAttr(popover.open)}
      data-slot={dataSlot(props, "popover-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) popover.setOpen(!popover.open);
      }}
    />
  );
}
