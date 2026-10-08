import { Fragment, type ComponentProps, type MouseEvent, type PointerEvent } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from "./navigation-menu-shared.js";

export type NavigationMenuTriggerProps = ComponentProps<"button"> & AsProp;

export function NavigationMenuTrigger({
  as,
  onClick,
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
    menu.triggers.register({
      key: item.value,
      id: item.triggerId,
      textValue: element?.textContent?.trim() || item.value,
      element,
    });
    composeRefs(ref)(element);
  };

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={props.id ?? item.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      // Focus must reach non-native triggers or keyboard users cannot toggle
      // the panel. Fragment triggers keep their own element's focusability.
      tabIndex={isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0)}
      aria-expanded={open}
      aria-controls={item.contentId}
      data-open={dataAttr(open)}
      data-slot={dataSlot(props, "navigation-menu-trigger")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (open) menu.close();
        else menu.open(item.value);
      }}
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
