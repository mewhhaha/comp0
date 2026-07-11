import {
  createElement,
  Fragment,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { dataAttr } from "@comp0/core";
import { composeRefs } from "@comp0/core";
import { Slot, type RefProp } from "../shared.js";
import { MenuContext, resolveItemLabel } from "./collection-shared.js";
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
  // Inside a parent menu's popover the trigger becomes a submenu item: it
  // registers with the parent collection and opens with hover, click,
  // Enter, Space, or ArrowRight.
  const parentCollection = useContext(MenuContext);
  const submenu = menu?.isSubmenu === true && parentCollection !== null;
  const submenuKey = useId().replace(/:/g, "");
  const elementRef = useRef<HTMLElement | null>(null);
  const disabled = Boolean(props.disabled);
  const setElement = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current = element;
      menu?.setTriggerElement(element);
      if (submenu) {
        parentCollection?.register(
          submenuKey,
          element?.textContent?.trim() ?? submenuKey,
          element,
          disabled,
        );
      }
      composeRefs(ref)(element);
    },
    [disabled, menu, parentCollection, ref, submenu, submenuKey],
  );
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!submenu || !element) return;
    parentCollection?.register(
      submenuKey,
      resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: submenuKey,
      }),
      element,
      disabled,
    );
  });
  if (submenu) {
    return createElement("div", {
      ...props,
      ref: setElement,
      id: props.id ?? menu?.triggerId,
      role: "menuitem",
      tabIndex: -1,
      "aria-haspopup": "menu",
      "aria-controls": menu?.contentId,
      "aria-expanded": menu?.open,
      "aria-disabled": disabled || undefined,
      "data-disabled": dataAttr(disabled),
      "data-open": dataAttr(menu?.open),
      onClick(event: React.MouseEvent<HTMLElement>) {
        onClick?.(event as never);
        if (disabled) event.preventDefault();
        if (!event.defaultPrevented) menu?.setOpen(!menu.open);
      },
      onPointerEnter(event: React.PointerEvent<HTMLElement>) {
        (props.onPointerEnter as ((e: unknown) => void) | undefined)?.(event);
        if (disabled) return;
        event.currentTarget.focus();
        menu?.setOpen(true);
      },
      onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        onKeyDown?.(event as never);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          menu?.setOpen(true);
        }
      },
    });
  }
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
