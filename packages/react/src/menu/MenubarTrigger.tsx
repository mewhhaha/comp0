import {
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useComposedRefs } from "@comp0/core";
import { useRenderOrderSeed } from "../internal/collection-pass.js";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { resolveItemLabel } from "../internal/item-label.js";
import { NO_SELECTION, useIsTabStop } from "../internal/tab-stop.js";
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
  const elementRef = useRef<HTMLButtonElement | null>(null);
  // Skips focus-carried opening for the focus a pointer press causes, so a
  // click on a neighbor item toggles once instead of opening twice.
  const pointerPressed = useRef(false);
  const resolvedDisabled = Boolean(disabled);
  const tag = as ?? "div";
  // Read the stable registry and key outside the ref callback: depending on the whole bar
  // context would detach and re-register every item whenever the bar's tab stop moves.
  const { collection } = menubar;
  const key = menu.triggerId;
  useRenderOrderSeed(menubar.seed, key, resolvedDisabled);
  const isTabStop = useIsTabStop(menubar.tabStops, key);
  const tabIndex = isTabStop ? 0 : -1;
  // The stop depends on the whole bar, which the server can see in another order.
  useHydrationRepair(elementRef, { tabindex: String(tabIndex) }, () => {
    if (!resolvedDisabled) menubar.tabStops.focus(key, NO_SELECTION);
  });
  const registration = (element: HTMLElement | null) => {
    if (!element) return;
    // Guarded by element, so a stale cleanup cannot remove a replacement's registration.
    return () => {
      collection.unregister(key, element);
    };
  };
  const setElement = useComposedRefs<HTMLButtonElement>(
    ref,
    elementRef,
    menu.setTriggerElement,
    registration,
  );
  // Register after every render so labels and open state stay current; an unchanged item is a
  // no-op, and a change notifies the bar's tab stop subscription.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    collection.register({
      key,
      id: element.id,
      textValue: resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: key,
      }),
      element,
      disabled: resolvedDisabled,
      open: menu.open,
      setOpen: menu.setOpen,
    });
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
      tabIndex={tabIndex}
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
