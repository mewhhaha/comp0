import {
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { composeRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { resolveItemLabel } from "../internal/item-label.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { partElement } from "../internal/polymorphic.js";
import { useMenubarContext } from "../menubar/menubar-shared.js";
import { useMenuRootContext } from "./menu-shared.js";
import { type MenuTriggerProps } from "./MenuTrigger.js";

/**
 * A MenuTrigger inside a Menubar: it registers with the bar's roving
 * collection together with its open state, opens with ArrowDown, ArrowUp,
 * Enter, Space, or click, and carries openness when focus moves to it while a
 * sibling menu is open. Rendered as a div by default (typed with the button
 * props the part accepts), so the disabled state is always aria-disabled.
 */
export type MenubarTriggerProps = MenuTriggerProps;

export function MenubarTrigger({
  as,
  disabled,
  onClick,
  onFocus,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
  ref,
  style,
  ...props
}: MenubarTriggerProps) {
  const menu = useMenuRootContext("MenuTrigger");
  const menubar = useMenubarContext("MenuTrigger");
  const elementRef = useRef<HTMLElement | null>(null);
  // Skips focus-carried opening for the focus a pointer press causes, so a
  // click on a neighbor item toggles once instead of opening twice.
  const pointerPressed = useRef(false);
  const resolvedDisabled = Boolean(disabled);
  const tag = as ?? "div";
  const register = (element: HTMLElement | null) => {
    menubar.collection.register({
      key: menu.triggerId,
      id: element?.id,
      textValue: resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: menu.triggerId,
      }),
      element,
      disabled: resolvedDisabled,
      open: menu.open,
      setOpen: menu.setOpen,
    });
  };
  const setElement = (element: HTMLButtonElement | null) => {
    elementRef.current = element;
    menu.setTriggerElement(element);
    register(element);
    composeRefs(ref)(element);
  };
  // Re-register with the bar every render so labels and open state stay
  // current, then let the bar re-apply its single tab stop.
  useLayoutEffect(() => {
    if (!elementRef.current) return;
    register(elementRef.current);
    menubar.syncTabStops();
  });
  const trigger = useDisclosureTrigger({
    as: tag,
    open: menu.open,
    onOpenChange(next) {
      if (next) menubar.closeOthers(menu.triggerId);
      menu.setOpen(next);
    },
    id: menu.triggerId,
    controls: menu.contentId,
    haspopup: "menu",
    props: {
      ...props,
      disabled,
      onClick(event: MouseEvent<HTMLButtonElement>) {
        onClick?.(event);
        pointerPressed.current = false;
      },
      onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
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
    },
  });

  const Part = partElement(tag, "button");
  return (
    <Part
      {...props}
      ref={setElement}
      role="menuitem"
      style={triggerAnchorStyle(menu.triggerId, style)}
      {...trigger}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        pointerPressed.current = true;
      }}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (resolvedDisabled || menu.open || !menubar.isAnyOpen()) return;
        // Hover carries openness across the bar while any menu is open.
        event.currentTarget.focus();
      }}
      onFocus={(event: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        const skip = pointerPressed.current;
        pointerPressed.current = false;
        if (skip || menu.open || !menubar.isAnyOpen()) return;
        // Open follows focus while another menu in the bar is open.
        menubar.closeOthers(menu.triggerId);
        menu.setOpen(true);
      }}
    />
  );
}
