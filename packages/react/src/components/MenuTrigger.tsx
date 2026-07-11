import { createElement, Fragment, useCallback } from "react";
import { dataAttr } from "@comp0/core";
import { composeRefs } from "@comp0/core";
import { Slot, type RefProp } from "../shared.js";
import { useMenuRootContext, type MenuTriggerProps } from "./menu-shared.js";

export type { MenuTriggerProps } from "./menu-shared.js";

export function MenuTrigger({
  as,
  onClick,
  onKeyDown,
  ref,
  ...props
}: MenuTriggerProps & RefProp<HTMLElement>) {
  const menu = useMenuRootContext();
  const disabled = Boolean(props.disabled);
  const setElement = useCallback(
    (element: HTMLElement | null) => {
      menu?.setTriggerElement(element);
      composeRefs(ref)(element);
    },
    [menu, ref],
  );
  const Trigger = as === Fragment ? Slot : (as ?? "button");
  const isNativeButton = Trigger === "button";
  return createElement(Trigger, {
    ...props,
    ref: setElement,
    id: props.id ?? menu?.triggerId,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    disabled: isNativeButton ? disabled : undefined,
    "aria-disabled": isNativeButton ? undefined : disabled || undefined,
    role: isNativeButton ? props.role : (props.role ?? "button"),
    tabIndex: isNativeButton ? props.tabIndex : (props.tabIndex ?? 0),
    "aria-controls": (props as Record<string, unknown>)["aria-controls"] ?? menu?.contentId,
    "aria-expanded": menu?.open ?? (props as Record<string, unknown>)["aria-expanded"],
    "aria-haspopup": (props as Record<string, unknown>)["aria-haspopup"] ?? "menu",
    "data-disabled": dataAttr(disabled),
    "data-open": dataAttr(menu?.open),
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      onClick?.(event as never);
      if (disabled) event.preventDefault();
      if (!event.defaultPrevented) menu?.setOpen(!menu.open);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event as never);
      if (event.defaultPrevented || isNativeButton || disabled) return;
      if (event.key === " ") event.preventDefault();
      if (event.key === "Enter") event.currentTarget.click();
    },
    onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
      props.onKeyUp?.(event as never);
      if (event.defaultPrevented || isNativeButton || disabled || event.key !== " ") return;
      event.preventDefault();
      event.currentTarget.click();
    },
  });
}
