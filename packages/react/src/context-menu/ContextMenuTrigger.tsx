import { useEffect, useRef, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useContextMenuContext, useMenuRootContext } from "../menu/menu-shared.js";

export type ContextMenuTriggerProps = ComponentProps<"div"> & AsProp;

/**
 * The right-clickable area of a ContextMenu: a plain div passthrough that
 * opens the menu at the pointer on contextmenu, and from the keyboard with
 * Shift+F10 or the ContextMenu key while focus is inside it. Give it (or
 * something inside it) a tab stop such as tabIndex={0} so keyboard users
 * can reach the menu.
 */
export function ContextMenuTrigger({
  as,
  onContextMenu,
  onKeyDown,
  ref,
  ...props
}: ContextMenuTriggerProps) {
  const menu = useMenuRootContext("ContextMenuTrigger");
  const contextMenu = useContextMenuContext("ContextMenuTrigger");
  const pendingPointerOpen = useRef<AbortController | null>(null);
  const pendingOpenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setElement = (element: HTMLDivElement | null) => {
    menu.setTriggerElement(element);
    composeRefs(ref)(element);
  };
  useEffect(
    () => () => {
      pendingPointerOpen.current?.abort();
      clearTimeout(pendingOpenTimer.current);
    },
    [],
  );

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={setElement}
      id={props.id ?? menu.triggerId}
      data-open={dataAttr(menu.open)}
      onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
        onContextMenu?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        pendingPointerOpen.current?.abort();
        clearTimeout(pendingOpenTimer.current);
        if (event.buttons === 0) {
          contextMenu.openAt(event.clientX, event.clientY);
          return;
        }

        // Opening an auto popover during contextmenu lets the pointerup from
        // the same press light-dismiss it, so open after that press settles.
        const pendingOpen = new AbortController();
        const ownerDocument = event.currentTarget.ownerDocument;
        const { clientX, clientY } = event;
        pendingPointerOpen.current = pendingOpen;
        ownerDocument.addEventListener(
          "pointerup",
          () => {
            pendingOpen.abort();
            pendingPointerOpen.current = null;
            pendingOpenTimer.current = setTimeout(() => {
              pendingOpenTimer.current = undefined;
              contextMenu.openAt(clientX, clientY);
            });
          },
          { capture: true, once: true, signal: pendingOpen.signal },
        );
        ownerDocument.addEventListener(
          "pointercancel",
          () => {
            pendingOpen.abort();
            pendingPointerOpen.current = null;
          },
          { capture: true, once: true, signal: pendingOpen.signal },
        );
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
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
        contextMenu.openAt(rect.left, rect.bottom);
      }}
    />
  );
}
