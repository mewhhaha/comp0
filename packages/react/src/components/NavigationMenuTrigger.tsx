import {
  createElement,
  Fragment,
  useContext,
  type ButtonHTMLAttributes,
  type ElementType,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, Slot, type RefProp } from "../shared.js";
import { NavigationMenuContext, NavigationMenuItemContext } from "./navigation-menu-shared.js";

export type NavigationMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: ElementType | typeof Fragment | undefined;
};

export function NavigationMenuTrigger({
  as,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: NavigationMenuTriggerProps & RefProp<HTMLButtonElement>) {
  const menu = useContext(NavigationMenuContext);
  const item = useContext(NavigationMenuItemContext);
  const open = item?.open ?? false;
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";

  const registerElement = (element: HTMLButtonElement | null) => {
    if (item) menu?.registerTrigger(item.value, element);
  };
  const triggerRef = useComposedRefs(ref, registerElement);

  return createElement(Trigger, {
    ...props,
    ref: triggerRef,
    id: props.id ?? item?.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    // Focus must reach non-native triggers or keyboard users cannot toggle
    // the panel. Fragment triggers keep their own element's focusability.
    tabIndex: isNativeButton || as === Fragment ? props.tabIndex : (props.tabIndex ?? 0),
    "aria-expanded": open,
    "aria-controls": item?.contentId,
    "data-open": dataAttr(open),
    "data-slot": dataSlot(props, "navigation-menu-trigger"),
    onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented || !item) return;
      if (open) menu?.close();
      else menu?.open(item.value);
    },
    onPointerEnter(event: React.PointerEvent<HTMLButtonElement>) {
      onPointerEnter?.(event);
      if (event.defaultPrevented || !item || open) return;
      menu?.scheduleOpen(item.value);
    },
    onPointerLeave(event: React.PointerEvent<HTMLButtonElement>) {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) menu?.cancelOpen();
    },
  });
}
