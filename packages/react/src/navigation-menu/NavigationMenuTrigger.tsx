import { Fragment, type ComponentProps, type PointerEvent } from "react";
import { composeRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from "./navigation-menu-shared.js";

export type NavigationMenuTriggerProps = ComponentProps<"button"> & AsProp;

export function NavigationMenuTrigger({
  as,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: NavigationMenuTriggerProps) {
  const menu = useNavigationMenuContext("NavigationMenuTrigger");
  const item = useNavigationMenuItemContext("NavigationMenuTrigger");
  const { open } = item;
  const isNativeButton = as === undefined || as === "button";
  const triggerRef = (element: HTMLButtonElement | null) => {
    menu.stops.register({
      key: item.triggerId,
      id: item.triggerId,
      textValue: element?.textContent?.trim() || item.value,
      element,
      kind: "trigger",
      panel: undefined,
      value: item.value,
    });
    composeRefs(ref)(element);
  };
  const trigger = useDisclosureTrigger({
    as,
    open,
    onOpenChange(next) {
      if (next) menu.open(item.value);
      else menu.close();
    },
    id: item.triggerId,
    controls: item.panelId,
    props,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="navigation-menu-trigger"
      {...props}
      ref={triggerRef}
      // Focus must reach non-native triggers or keyboard users cannot toggle
      // the panel. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      {...trigger}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (event.defaultPrevented || open) return;
        menu.scheduleOpen(item.value);
      }}
      onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) menu.cancelOpen();
      }}
    />
  );
}
