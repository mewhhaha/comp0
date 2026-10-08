import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { resolveItemLabel } from "../internal/item-label.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useMenuRootContext, useOptionalMenuListContext } from "./menu-shared.js";
import { useOptionalMenubarContext } from "../menubar/menubar-shared.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { writingDirection } from "../internal/writing-direction.js";

export type MenuTriggerProps = Omit<ComponentProps<"button">, "aria-expanded"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function MenuTrigger({
  as,
  disabled: disabledProp,
  onClick,
  onKeyDown,
  ref,
  style,
  ...props
}: MenuTriggerProps) {
  const menu = useMenuRootContext("MenuTrigger");
  // Inside a parent menu's popover the trigger becomes a submenu item: it
  // registers with the parent collection and opens with hover, click,
  // Enter, Space, or the inline-forward arrow.
  const parentList = useOptionalMenuListContext();
  const submenu = menu.isSubmenu && parentList !== null;
  // Inside a menubar the trigger of a top-level menu becomes a menubar item:
  // it registers with the bar's roving collection, opens with ArrowDown,
  // Enter, Space, or click, and carries openness when focus moves to it
  // while a sibling menu is open.
  const menubar = useOptionalMenubarContext();
  const menubarItem = menubar !== null && !menu.isSubmenu && parentList === null;
  const submenuKey = useId().replace(/:/g, "");
  const elementRef = useRef<HTMLElement | null>(null);
  // Skips focus-carried opening for the focus a pointer press causes, so a
  // click on a neighbor item toggles once instead of opening twice.
  const pointerPressed = useRef(false);
  const disabled = Boolean(disabledProp);
  const setElement = (element: HTMLButtonElement | null) => {
    elementRef.current = element;
    menu.setTriggerElement(element);
    if (submenu) {
      parentList.collection.register({
        key: submenuKey,
        id: element?.id,
        textValue: element?.textContent?.trim() ?? submenuKey,
        element,
        disabled,
      });
    }
    if (menubarItem) {
      menubar.register({
        key: menu.triggerId,
        id: element?.id,
        textValue: element?.textContent?.trim() ?? menu.triggerId,
        element,
        disabled,
      });
      if (!element) menubar.reportMenu(menu.triggerId, false, null);
    }
    composeRefs(ref)(element);
  };
  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!submenu || !element) return;
    parentList.collection.register({
      key: submenuKey,
      id: element.id,
      textValue: resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: submenuKey,
      }),
      element,
      disabled,
    });
  });
  // Re-register with the bar every render so labels and open state stay
  // current, then let the bar re-apply its single tab stop.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!menubarItem || !element) return;
    menubar.register({
      key: menu.triggerId,
      id: element.id,
      textValue: resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: menu.triggerId,
      }),
      element,
      disabled,
    });
    menubar.reportMenu(menu.triggerId, menu.open, (next) => menu.setOpen(next));
    menubar.syncTabStops();
  });
  if (menubarItem) {
    const Part = partElement(as, "div");
    return (
      <Part
        {...props}
        ref={setElement}
        id={props.id ?? menu.triggerId}
        type={undefined}
        role="menuitem"
        style={triggerAnchorStyle(menu.triggerId, style)}
        aria-haspopup="menu"
        aria-controls={menu.contentId}
        aria-expanded={menu.open}
        aria-disabled={disabled || undefined}
        data-disabled={dataAttr(disabled)}
        data-open={dataAttr(menu.open)}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          pointerPressed.current = false;
          if (disabled) event.preventDefault();
          if (event.defaultPrevented) return;
          const next = !menu.open;
          if (next) menubar.closeOthers(menu.triggerId);
          menu.setOpen(next);
        }}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
          props.onPointerDown?.(event);
          pointerPressed.current = true;
        }}
        onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
          props.onPointerEnter?.(event);
          if (disabled || menu.open || !menubar.isAnyOpen()) return;
          // Hover carries openness across the bar while any menu is open.
          event.currentTarget.focus();
        }}
        onFocus={(event: FocusEvent<HTMLButtonElement>) => {
          props.onFocus?.(event);
          if (event.defaultPrevented || disabled) return;
          const skip = pointerPressed.current;
          pointerPressed.current = false;
          if (skip || menu.open || !menubar.isAnyOpen()) return;
          // Open follows focus while another menu in the bar is open.
          menubar.closeOthers(menu.triggerId);
          menu.setOpen(true);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
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
        }}
      />
    );
  }
  if (submenu) {
    const Part2 = partElement(as, "div");
    return (
      <Part2
        {...props}
        ref={setElement}
        id={props.id ?? menu.triggerId}
        type={undefined}
        role="menuitem"
        tabIndex={-1}
        style={triggerAnchorStyle(menu.triggerId, style)}
        aria-haspopup="menu"
        aria-controls={menu.contentId}
        aria-expanded={menu.open}
        aria-disabled={disabled || undefined}
        data-disabled={dataAttr(disabled)}
        data-open={dataAttr(menu.open)}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (disabled) event.preventDefault();
          if (!event.defaultPrevented) menu.setOpen(!menu.open);
        }}
        onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
          props.onPointerEnter?.(event);
          if (disabled) return;
          event.currentTarget.focus();
          menu.setOpen(true);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled) return;
          const openSubmenuKey =
            writingDirection(event.currentTarget) === "rtl" ? "ArrowLeft" : "ArrowRight";
          if (event.key === openSubmenuKey || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            menu.setOpen(true);
          }
        }}
      />
    );
  }
  const isNativeButton = as === undefined || as === "button";
  const Part3 = partElement(as, "button");
  return (
    <Part3
      {...props}
      ref={setElement}
      id={props.id ?? menu.triggerId}
      style={triggerAnchorStyle(menu.triggerId, style)}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      disabled={isNativeButton ? disabled : undefined}
      aria-disabled={isNativeButton ? undefined : disabled || undefined}
      role={isNativeButton ? props.role : (props.role ?? "button")}
      tabIndex={isNativeButton ? props.tabIndex : (props.tabIndex ?? 0)}
      aria-controls={props["aria-controls"] ?? menu.contentId}
      aria-expanded={menu.open}
      aria-haspopup={props["aria-haspopup"] ?? "menu"}
      data-disabled={dataAttr(disabled)}
      data-open={dataAttr(menu.open)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (disabled) event.preventDefault();
        if (!event.defaultPrevented) menu.setOpen(!menu.open);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          menu.requestInitialFocus(event.key === "ArrowUp" ? "last" : "first");
          menu.setOpen(true);
          return;
        }
        if (isNativeButton) return;
        if (event.key === " ") event.preventDefault();
        if (event.key === "Enter") event.currentTarget.click();
      }}
      onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
        props.onKeyUp?.(event);
        if (event.defaultPrevented || isNativeButton || disabled || event.key !== " ") return;
        event.preventDefault();
        event.currentTarget.click();
      }}
    />
  );
}
