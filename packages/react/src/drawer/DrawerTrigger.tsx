import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useDrawerContext } from "./drawer-shared.js";

export type DrawerTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function DrawerTrigger({ as, onClick, ref, ...props }: DrawerTriggerProps) {
  const drawer = useDrawerContext("DrawerTrigger");
  const triggerRef = useComposedRefs(ref, drawer.setTriggerElement);
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? drawer.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-controls={props["aria-controls"] ?? drawer.contentId}
      aria-expanded={drawer.open}
      aria-haspopup={props["aria-haspopup"] ?? "dialog"}
      data-open={dataAttr(drawer.open)}
      data-slot={dataSlot(props, "drawer-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) drawer.setOpen(!drawer.open);
      }}
    />
  );
}
