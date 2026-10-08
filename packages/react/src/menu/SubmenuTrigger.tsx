import { useId, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { composeRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { resolveItemLabel } from "../internal/item-label.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { partElement } from "../internal/polymorphic.js";
import { writingDirection } from "../internal/writing-direction.js";
import { useMenuListContext, useMenuRootContext } from "./menu-shared.js";
import { type MenuTriggerProps } from "./MenuTrigger.js";

/**
 * A MenuTrigger inside a parent menu's list: it registers with the parent
 * collection like an item and opens with hover, click, Enter, Space, or the
 * inline-forward arrow. Rendered as a div by default (typed with the button
 * props the part accepts), so the disabled state is always aria-disabled.
 */
export type SubmenuTriggerProps = MenuTriggerProps;

export function SubmenuTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  onPointerEnter,
  ref,
  style,
  ...props
}: SubmenuTriggerProps) {
  const menu = useMenuRootContext("MenuTrigger");
  const parentList = useMenuListContext("MenuTrigger");
  const key = useId().replace(/:/g, "");
  const elementRef = useRef<HTMLElement | null>(null);
  const resolvedDisabled = Boolean(disabled);
  const tag = as ?? "div";
  const register = (element: HTMLElement | null) => {
    parentList.collection.register({
      key,
      id: element?.id,
      textValue: resolveItemLabel({
        textValue: undefined,
        children: undefined,
        element,
        ariaLabel: props["aria-label"],
        fallback: key,
      }),
      element,
      disabled: resolvedDisabled,
    });
  };
  const setElement = (element: HTMLButtonElement | null) => {
    elementRef.current = element;
    menu.setTriggerElement(element);
    register(element);
    composeRefs(ref)(element);
  };
  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    if (elementRef.current) register(elementRef.current);
  });
  const trigger = useDisclosureTrigger({
    as: tag,
    open: menu.open,
    // Hover already opens a submenu, so a click must not toggle it shut again.
    onOpenChange: () => menu.setOpen(true),
    id: menu.triggerId,
    controls: menu.contentId,
    haspopup: "menu",
    props: {
      ...props,
      disabled,
      onClick,
      onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        const openKey =
          writingDirection(event.currentTarget) === "rtl" ? "ArrowLeft" : "ArrowRight";
        if (event.key === openKey || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
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
      tabIndex={-1}
      style={triggerAnchorStyle(menu.triggerId, style)}
      {...trigger}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (resolvedDisabled) return;
        event.currentTarget.focus();
        menu.setOpen(true);
      }}
    />
  );
}
