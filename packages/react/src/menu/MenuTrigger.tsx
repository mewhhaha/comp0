import { type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOptionalMenubarContext } from "../menubar/menubar-shared.js";
import { MenubarTrigger } from "./MenubarTrigger.js";
import { useMenuRootContext, useOptionalMenuListContext } from "./menu-shared.js";
import { SubmenuTrigger } from "./SubmenuTrigger.js";

export type MenuTriggerProps = Omit<ComponentProps<"button">, "aria-expanded"> & AsProp;

/**
 * Opens its Menu. The same part adapts to where it sits: inside a parent
 * menu's list it is a submenu item, inside a Menubar it is a bar item, and
 * anywhere else it is a button with menu semantics.
 */
export function MenuTrigger(props: MenuTriggerProps) {
  const menu = useMenuRootContext("MenuTrigger");
  const parentList = useOptionalMenuListContext();
  const menubar = useOptionalMenubarContext();
  if (menu.isSubmenu && parentList !== null) return <SubmenuTrigger {...props} />;
  if (menubar !== null && !menu.isSubmenu && parentList === null) {
    return <MenubarTrigger {...props} />;
  }
  return <MenuButtonTrigger {...props} />;
}

function MenuButtonTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  ref,
  style,
  ...props
}: MenuTriggerProps) {
  const menu = useMenuRootContext("MenuTrigger");
  const isNativeButton = as === undefined || as === "button";
  const setElement = (element: HTMLButtonElement | null) => {
    menu.setTriggerElement(element);
    composeRefs(ref)(element);
  };
  const trigger = useDisclosureTrigger({
    as,
    open: menu.open,
    onOpenChange: menu.setOpen,
    id: menu.triggerId,
    controls: menu.contentId,
    haspopup: "menu",
    props: {
      ...props,
      disabled,
      onClick,
      onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
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
      },
    },
  });

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={setElement}
      style={triggerAnchorStyle(menu.triggerId, style)}
      role={isNativeButton ? props.role : (props.role ?? "button")}
      tabIndex={isNativeButton ? props.tabIndex : (props.tabIndex ?? 0)}
      {...trigger}
      onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
        props.onKeyUp?.(event);
        if (event.defaultPrevented || isNativeButton || disabled || event.key !== " ") return;
        event.preventDefault();
        event.currentTarget.click();
      }}
    />
  );
}
