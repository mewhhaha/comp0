import { createElement, Fragment, useContext, useId, useLayoutEffect, useRef } from "react";
import { dataAttr } from "@comp0/core";
import { composeRefs } from "@comp0/core";
import { Slot, type RefProp } from "../shared.js";
import { MenuContext, resolveItemLabel } from "./collection-shared.js";
import { useMenuRootContext, type MenuTriggerProps } from "./menu-shared.js";
import { useMenubarContext } from "./menubar-shared.js";
import { triggerAnchorStyle } from "./overlay-shared.js";

export type { MenuTriggerProps } from "./menu-shared.js";

export function MenuTrigger({
  as,
  disabled: disabledProp,
  onClick,
  onKeyDown,
  ref,
  style,
  ...props
}: MenuTriggerProps & RefProp<HTMLElement>) {
  const menu = useMenuRootContext();
  // Inside a parent menu's popover the trigger becomes a submenu item: it
  // registers with the parent collection and opens with hover, click,
  // Enter, Space, or ArrowRight.
  const parentCollection = useContext(MenuContext);
  const submenu = menu?.isSubmenu === true && parentCollection !== null;
  // Inside a menubar the trigger of a top-level menu becomes a menubar item:
  // it registers with the bar's roving collection, opens with ArrowDown,
  // Enter, Space, or click, and carries openness when focus moves to it
  // while a sibling menu is open.
  const menubar = useMenubarContext();
  const menubarItem =
    menubar !== null && menu !== null && !menu.isSubmenu && parentCollection === null;
  const submenuKey = useId().replace(/:/g, "");
  const elementRef = useRef<HTMLElement | null>(null);
  // Skips focus-carried opening for the focus a pointer press causes, so a
  // click on a neighbor item toggles once instead of opening twice.
  const pointerPressed = useRef(false);
  const disabled = Boolean(disabledProp);
  const setElement = (element: HTMLElement | null) => {
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
    if (menubarItem && menu) {
      menubar.register(
        menu.triggerId,
        element?.textContent?.trim() ?? menu.triggerId,
        element,
        disabled,
      );
      if (!element) menubar.reportMenu(menu.triggerId, false, null);
    }
    composeRefs(ref)(element);
  };
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
  // Re-register with the bar every render so labels and open state stay
  // current, then let the bar re-apply its single tab stop.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!menubarItem || !menu || !element) return;
    menubar.register(
      menu.triggerId,
      resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: menu.triggerId,
      }),
      element,
      disabled,
    );
    menubar.reportMenu(menu.triggerId, menu.open, (next) => menu.setOpen(next));
    menubar.syncTabStops();
  });
  if (menubarItem && menu) {
    return createElement("div", {
      ...props,
      ref: setElement,
      id: props.id ?? menu.triggerId,
      type: undefined,
      role: "menuitem",
      style: triggerAnchorStyle(menu.triggerId, style),
      "aria-haspopup": "menu",
      "aria-controls": menu.contentId,
      "aria-expanded": menu.open,
      "aria-disabled": disabled || undefined,
      "data-disabled": dataAttr(disabled),
      "data-open": dataAttr(menu.open),
      onClick(event: React.MouseEvent<HTMLElement>) {
        onClick?.(event as never);
        pointerPressed.current = false;
        if (disabled) event.preventDefault();
        if (event.defaultPrevented) return;
        const next = !menu.open;
        if (next) menubar.closeOthers(menu.triggerId);
        menu.setOpen(next);
      },
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        (props.onPointerDown as ((e: unknown) => void) | undefined)?.(event);
        pointerPressed.current = true;
      },
      onPointerEnter(event: React.PointerEvent<HTMLElement>) {
        (props.onPointerEnter as ((e: unknown) => void) | undefined)?.(event);
        if (disabled || menu.open || !menubar.isAnyOpen()) return;
        // Hover carries openness across the bar while any menu is open.
        event.currentTarget.focus();
      },
      onFocus(event: React.FocusEvent<HTMLElement>) {
        (props.onFocus as ((e: unknown) => void) | undefined)?.(event);
        if (event.defaultPrevented || disabled) return;
        const skip = pointerPressed.current;
        pointerPressed.current = false;
        if (skip || menu.open || !menubar.isAnyOpen()) return;
        // Open follows focus while another menu in the bar is open.
        menubar.closeOthers(menu.triggerId);
        menu.setOpen(true);
      },
      onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        onKeyDown?.(event as never);
        if (event.defaultPrevented || disabled) return;
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          menubar.closeOthers(menu.triggerId);
          menu.requestInitialFocus(event.key === "ArrowUp" ? "last" : "first");
          menu.setOpen(true);
        }
      },
    });
  }
  if (submenu) {
    return createElement("div", {
      ...props,
      ref: setElement,
      id: props.id ?? menu?.triggerId,
      type: undefined,
      role: "menuitem",
      tabIndex: -1,
      style: triggerAnchorStyle(menu?.triggerId, style),
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
    style: triggerAnchorStyle(menu?.triggerId, style),
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
      if (event.defaultPrevented || disabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        menu?.requestInitialFocus(event.key === "ArrowUp" ? "last" : "first");
        menu?.setOpen(true);
        return;
      }
      if (isNativeButton) return;
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
