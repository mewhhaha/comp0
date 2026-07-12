import { type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import { useContextMenuContext, useMenuRootContext } from "./menu-shared.js";

export type ContextMenuTriggerProps = HTMLAttributes<HTMLDivElement>;

/**
 * The right-clickable area of a ContextMenu: a plain div passthrough that
 * opens the menu at the pointer on contextmenu, and from the keyboard with
 * Shift+F10 or the ContextMenu key while focus is inside it. Give it (or
 * something inside it) a tab stop such as tabIndex={0} so keyboard users
 * can reach the menu.
 */
export function ContextMenuTrigger({
  onContextMenu,
  onKeyDown,
  ref,
  ...props
}: ContextMenuTriggerProps & RefProp<HTMLDivElement>) {
  const menu = useMenuRootContext();
  const contextMenu = useContextMenuContext();
  const setElement = (element: HTMLDivElement | null) => {
    menu?.setTriggerElement(element);
    composeRefs(ref)(element);
  };

  return (
    <InteractiveDiv
      {...props}
      ref={setElement}
      id={props.id ?? menu?.triggerId}
      data-open={dataAttr(menu?.open)}
      onContextMenu={(event) => {
        onContextMenu?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        contextMenu?.openAt(event.clientX, event.clientY);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const contextMenuKey =
          event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
        if (!contextMenuKey) return;
        // Canceling the keydown also suppresses the native contextmenu
        // event some browsers synthesize for these keys.
        event.preventDefault();
        let target = event.currentTarget as HTMLElement;
        if (event.target instanceof HTMLElement) target = event.target;
        const rect = target.getBoundingClientRect();
        contextMenu?.openAt(rect.left, rect.bottom);
      }}
    />
  );
}
